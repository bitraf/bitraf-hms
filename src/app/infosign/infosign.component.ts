import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { finalize, tap } from 'rxjs/operators';
import * as jsonld from 'node_modules/jsonld/dist/jsonld.min.js';

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
    let url1 = "https://bitraf.no/wiki/Spesial:Eksporter_RDF/" + this.pageName.value;
    let url = "https://rdf-translator.appspot.com/convert/xml/json-ld/" + url1;

    console.log("Page name", this.pageName.value);

    this.http.get(url, {responseType: "text"}).subscribe(this.parse);
  }

  parse(text: string) {
    let doc = JSON.parse(text);
    console.log("woot", doc);
    jsonld.expand(doc, function(err, expanded) {
      console.log("expanded", expanded);
    });
  }

  /*
  parse2(text: String) {
    const parser = new RdfXmlParser();

    parser.on("data", console.log);
    parser.on("error", console.log);
    parser.on("end", () => console.log("END!!"));

    parser.write(text);
  }
  */
}
