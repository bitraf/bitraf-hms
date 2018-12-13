import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { finalize, tap } from 'rxjs/operators';

import * as jsonld from 'node_modules/jsonld/dist/jsonld.min.js';
import * as _ from "lodash";

const uriResolverPrefix = "http://bitraf.no/wiki/Special:URIResolver/";
const rdfExportPrefix = "https://bitraf.no/wiki/Spesial:Eksporter_RDF/";

@Component({
  selector: 'app-infosign',
  templateUrl: './infosign.component.html',
  styleUrls: ['./infosign.component.css']
})
export class InfosignComponent implements OnInit {
  pageName = new FormControl("");

  constructor(private http: HttpClient) {
    this.pageName.setValue("CNC3-3018Pro");
  }

  ngOnInit() {
  }

  generate() {
    let url1 = rdfExportPrefix + this.pageName.value;
    let url = "https://rdf-translator.appspot.com/convert/xml/json-ld/" + url1;

    let pageName = this.pageName.value;
    console.log("Page name", pageName);

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
    });
  }
}
