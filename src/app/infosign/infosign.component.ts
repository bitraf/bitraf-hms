import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { finalize, tap } from 'rxjs/operators';

import * as jsonld from 'node_modules/jsonld/dist/jsonld.min.js';
import * as _ from "lodash";
import {barcode, qrcode, svg2url} from 'pure-svg-code';

const uriResolverPrefix = "http://bitraf.no/wiki/Special:URIResolver/";
const rdfExportPrefix = "https://bitraf.no/wiki/Spesial:Eksporter_RDF/";
const pagePrefix = "https://bitraf.no/wiki/";

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

  constructor(private http: HttpClient, private sanitizer: DomSanitizer) {
    this.pageName.setValue("CNC3-3018Pro");
  }

  ngOnInit() {
  }

  generate() {
    let pageUrl = pagePrefix + this.pageName.value;
    this.pageUrl = pageUrl;
    let url1 = rdfExportPrefix + this.pageName.value;
    let url = "https://rdf-translator.appspot.com/convert/xml/json-ld/" + url1;

    let pageName = this.pageName.value;
    console.log("Page name", pageName);

    let svgString = qrcode({
      content: url,
      padding: 4,
      width: 256,
      height: 256,
      color: "#000000",
      background: "#ffffff",
      ecl: "M"
    })
    this.svgText = this.sanitizer.bypassSecurityTrustHtml(svgString);

    this.http.get(url, {responseType: "text"}).subscribe((text) => this.parse(text, pageName));
  }

  encode(str: string) {
    return str.replace("-", "-2D");
  }
  makeValueObj(value: string) { return {"@value": value}; };

  parse(text: string, pageName: string) {
    let doc = JSON.parse(text);
    // console.log("raw doc", doc);
    jsonld.expand(doc, (err, expanded) => {
      console.log("expanded doc", expanded);
      let pageId = encodeURI(uriResolverPrefix + pageName);
      console.log("pageId", pageId);
      console.log("pageId", this.encode(pageId));
      let page = _.find(expanded, {"@id": this.encode(pageId)});
      console.log("page", page);
      this.title = page["http://www.w3.org/2000/01/rdf-schema#label"][0]["@value"];
      this.hazards = page["http://bitraf.no/wiki/Special:URIResolver/Property-3AHas_EHS_hazard"]
      this.requiredTrainings = page["http://bitraf.no/wiki/Special:URIResolver/Property-3AHas_required_training"]
      this.requiredPpes = page["http://bitraf.no/wiki/Special:URIResolver/Property-3AHas_required_PPE"]
      this.ready = true;
    });
  }
}
