import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { finalize, tap } from 'rxjs/operators';

import * as jsonld from 'node_modules/jsonld/dist/jsonld.min.js';
import * as _ from "lodash";
import {barcode, qrcode, svg2url} from 'pure-svg-code';

const uriResolverPrefix = "https://bitraf.no/wiki/Special:URIResolver/";
const rdfExportPrefix = "https://bitraf.no/wiki/Spesial:Eksporter_RDF/";
const pagePrefix = "https://bitraf.no/wiki/";

enum RdfUrls {
  has_ehs_hazard = "https://bitraf.no/wiki/Special:URIResolver/Property-3AHas_EHS_hazard",
  has_required_training = "https://bitraf.no/wiki/Special:URIResolver/Property-3AHas_required_training",
  has_required_ppe = "https://bitraf.no/wiki/Special:URIResolver/Property-3AHas_required_PPE",
  has_icon_url = "https://bitraf.no/wiki/Special:URIResolver/Property-3AHas_Icon_URL",
  label = "http://www.w3.org/2000/01/rdf-schema#label",
}

@Component({
  selector: 'app-infosign',
  templateUrl: './infosign.component.html',
  styleUrls: ['./infosign.component.css']
})
export class InfosignComponent implements OnInit {
  pageName = new FormControl("");
  svgText: SafeHtml;

  ready: boolean = false;
  status: string = "";
  title;
  hazards;
  requiredTrainings;
  requiredPpes;
  pageUrl;
  downloads = [];
  warnings = [];

  constructor(private http: HttpClient, private sanitizer: DomSanitizer) {
    this.pageName.setValue("ShopBot");
  }

  ngOnInit() {
  }

  generate() {
    let pageUrl = pagePrefix + this.pageName.value;
    this.pageUrl = pageUrl;
    let url1 = rdfExportPrefix + this.pageName.value;

    let pageName = this.pageName.value;
    console.log("Page name", pageName);

    let svgString = qrcode({
      content: pageUrl,
      padding: 4,
      width: 256,
      height: 256,
      color: "#000000",
      background: "#ffffff",
      ecl: "M"
    })
    this.svgText = this.sanitizer.bypassSecurityTrustHtml(svgString);

    this.downloads = []
    this.warnings = []
    this.status = null
    this.ready = false
    this.downloadRdf(url1, (err, doc) => this.handleMainDoc(err, doc));
  }

  encode(str: string) {
    return str.replace("-", "-2D");
  }
  makeValueObj(value: string) { return {"@value": value}; };

  downloadRdf(urlRdf: string, cb) {
    let url = "https://rdf-translator.appspot.com/convert/xml/json-ld/" + urlRdf;
    let tx = {url: urlRdf, done: false}
    this.downloads.push(tx)
    return this.http.get(url, {responseType: "text"}).
      subscribe((text) => {
        tx.done = true
        // console.log("text from " + url, text);
        let doc = JSON.parse(text);
        // console.log("doc from " + url, text);
        jsonld.expand(doc, cb);
      }
    );
  }

  handleMainDoc(err, doc) {
    let pageName = this.pageName.value;

    let pageId = encodeURI(uriResolverPrefix + pageName);
    let page = _.find(doc, {"@id": this.encode(pageId)});

    if (!page) {
      console.log("pageId", pageId)
      console.log("page", doc)
      this.status = "Could not find page object."
      return
    }
    this.ready = true

    this.title = page[RdfUrls.label][0]["@value"];

    this.requiredTrainings = this.handlePpes(page, RdfUrls.has_required_training)
    this.hazards = this.handlePpes(page, RdfUrls.has_ehs_hazard)
    this.requiredPpes = this.handlePpes(page, RdfUrls.has_required_ppe)
  }

  handlePpes(page, typeUrl) {
    let items = page[typeUrl];
    let collection = []
    for (let k in items) {
      let url = items[k]["@id"]
      this.downloadRdf(url, (err, doc) => {
        let item = _.find(doc, {"@id": url});
        if (!item) {
          this.warnings.push("Could not description of " + url)
          collection.push({label: "Bad: " + url})
          return
        }
        let label = item[RdfUrls.label][0]["@value"]
        let hasIconUrl = item[RdfUrls.has_icon_url][0]["@id"]

        collection.push({label: label, icon: hasIconUrl})
      })
    }
    return collection
  }
}
