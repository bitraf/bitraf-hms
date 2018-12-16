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
  title;
  hazards;
  requiredTrainings;
  requiredPpes;
  pageUrl;
  downloads = [];

  constructor(private http: HttpClient, private sanitizer: DomSanitizer) {
    this.pageName.setValue("CNC3-3018Pro");
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

    this.downloadRdf(url1, (err, doc) => this.handleMainDoc(err, doc));
  }

  encode(str: string) {
    return str.replace("-", "-2D");
  }
  makeValueObj(value: string) { return {"@value": value}; };

  downloadRdf(urlRdf: string, cb) {
    let url = "https://rdf-translator.appspot.com/convert/xml/json-ld/" + urlRdf;
    this.downloads.push(urlRdf)
    return this.http.get(url, {responseType: "text"}).
      subscribe((text) => {
        // console.log("text from " + url, text);
        let doc = JSON.parse(text);
        // console.log("doc from " + url, text);
        jsonld.expand(doc, cb);
      }
    );
  }

  handleMainDoc(err, doc) {
    let pageName = this.pageName.value;
    console.log("expanded doc", doc);
    let pageId = encodeURI(uriResolverPrefix + pageName);
    console.log("pageId", pageId);
    console.log("pageId", this.encode(pageId));
    let page = _.find(doc, {"@id": this.encode(pageId)});
    console.log("page", page);

    this.title = page["http://www.w3.org/2000/01/rdf-schema#label"][0]["@value"];
    this.hazards = page[RdfUrls.has_ehs_hazard]
    this.requiredTrainings = page[RdfUrls.has_required_training]
    this.ready = true;

    let ppes = page[RdfUrls.has_required_ppe];
    this.requiredPpes = [];

    for (let k in ppes) {
      let obj = ppes[k]
      console.log("obj", obj);
      let ppeUrl = obj["@id"]
      console.log("ppeUrl", ppeUrl);
      this.downloadRdf(ppeUrl, (err, ppeDoc) => {
        console.log("ppe", ppeDoc)
        let ppe = _.find(ppeDoc, {"@id": ppeUrl});
        console.log("ppe", ppe)
        let label = ppe[RdfUrls.label][0]["@value"]
        console.log("label", label)

        let hasIconUrl = ppe[RdfUrls.has_icon_url][0]["@id"]
        console.log("hasIconUrl", hasIconUrl)

        this.requiredPpes.push({label: label, icon: hasIconUrl})
      })
    }
  }
}
