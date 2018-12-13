import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InfosignComponent } from './infosign.component';

describe('InfosignComponent', () => {
  let component: InfosignComponent;
  let fixture: ComponentFixture<InfosignComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InfosignComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InfosignComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
