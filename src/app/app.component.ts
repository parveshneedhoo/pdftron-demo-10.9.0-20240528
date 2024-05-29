import {AfterViewInit, Component, ElementRef, EventEmitter,Output, ViewChild} from '@angular/core';
import WebViewer from "@pdftron/webviewer";
import { Core } from '@pdftron/webviewer';

@Component({
  selector: 'app-root',
  styleUrls: ['app.component.css'],
  templateUrl: 'app.component.html'
})
export class AppComponent implements AfterViewInit {
  @ViewChild('viewer') viewer!: ElementRef;

  docViewer: any;
  annotManager: any;
  fieldManager: any;
  document: any;
  elementWriter: any;
  instance: any;
  fieldChangesDebounced: any;
  onError: any;
  
  @Output() coreControlsEvent:EventEmitter<string> = new EventEmitter();

  ngAfterViewInit(): void {

    const options = {
      path: "../lib",
      licenseKey: "demo:1702924333888:7c8fe3900300000000b1eb3aad22888de45c07dd78b662456b14de4103",
      disabledElements: [
        "header",
        "toolsHeader",
        "pageNavOverlay",
        "leftPanel",
        "textSignaturePanelButton",
        "searchPanel",
        "textPopup",
        "imageSignaturePanelButton",
        "annotationCommentButton",
        "colorPalette",
        "annotationStyleEditButton",
        "menuOverlay",
        "annotationStylePopup",
        "toolStylePopup",
        "stylePopup",
        "printModal",
        "annotationNoteConnectorLine",
        "viewControlsOverlay",
        "zoomOverlay",
        "customStampModal",
        "contextMenuPopup",
        "toolsOverlay",
      ],
      fullAPI: true,
      css: "../../assets/webviewer.css",
    };
    WebViewer(options, this.viewer.nativeElement).then(async (instance) => {
      this.instance = instance;
      instance.UI.iframeWindow.addEventListener("loaderror", this.onError);
      instance.UI.loadDocument("../../files/calculation_field.pdf");
      this.annotManager = instance.Core.annotationManager;
      this.fieldManager = this.annotManager.getFieldManager();
      this.docViewer = instance.Core.documentViewer;
      instance.UI.setFitMode(instance.UI.FitMode.FitWidth); // workaround: keyboard keeps disappearing until zoomed
    });
  }
}
