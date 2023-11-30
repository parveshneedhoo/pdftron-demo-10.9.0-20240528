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

  fieldValues = {};
  docViewer: any;
  annotManager: any;
  fieldManager: any;
  document: any;
  elementWriter: any;
  instance: any;
  fieldChangesDebounced: any;
  onError: any;
  photoFieldPositions = {};
  
  @Output() coreControlsEvent:EventEmitter<string> = new EventEmitter();

  ngAfterViewInit(): void {

    const options = {
      path: "../lib",
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
      instance.UI.loadDocument("https://pdf-test-sharinpix.s3.eu-west-3.amazonaws.com/pdf_photo_field.pdf");
      this.annotManager = instance.Core.annotationManager;
      this.fieldManager = this.annotManager.getFieldManager();
      this.docViewer = instance.Core.documentViewer;
      instance.UI.setFitMode(instance.UI.FitMode.FitWidth); // workaround: keyboard keeps disappearing until zoomed
      this.docViewer.addEventListener("annotationsLoaded", async () => {
        console.log("ANNOTATION LOADED");
        await this.writeToImageField()
        await this.docViewer.refreshAll();
        await this.docViewer.updateView();
      });
    });
  }

  async writeToImageField() {
    await this.instance.Core.PDFNet.initialize();
    this.document = await this.docViewer.getDocument().getPDFDoc();
    this.elementWriter = await this.instance.Core.PDFNet.ElementWriter.create();
    const annotations = await this.annotManager.getAnnotationsList();
    for (const annotation of annotations) {
      if (
        annotation instanceof this.instance.Core.Annotations.WidgetAnnotation
      ) {
        if (annotation.getField().name === "sp_photo_6") {
          this.makeAnnotationTransparent(annotation);
          console.log("ANNOTATING");
          const rect = annotation.getRect();
          const img = await this.createPDFNetImageFromMedia();
          const pageNum = annotation.getPageNumber();
          const page = await this.document.getPage(pageNum);
          const pageHeight = this.docViewer.getPageHeight(pageNum);
          const builder = await this.instance.Core.PDFNet.ElementBuilder.create();
          console.log("rect: ", rect);
          console.log("pageHeight: ", pageHeight);
          console.log("img: ", img);
          console.log("rect width: ", rect.getWidth());
          console.log("rect height: ", rect.getHeight());
          const element = await builder.createImageScaled(
            img,
            rect.x1,
            pageHeight - rect.y2,
            rect.getWidth(),
            rect.getHeight()
          );
          console.log("Before beginOnPage");
          this.elementWriter.beginOnPage(
            page,
            this.instance.Core.PDFNet.ElementWriter.WriteMode.e_overlay
          );
          console.log("After begin and before writePlacedElement");
          await this.elementWriter.writePlacedElement(element);
          console.log("After writePlacedElement");
          await this.elementWriter.end();
          console.log("After end");
          break;
        }
      }
    }
  }

  async createPDFNetImageFromMedia(
  ): Promise<Core.PDFNet.Image> {
    return await this.instance.Core.PDFNet.Image.createFromURL(
      this.document,
      "../../files/image.jpg"
    );
  }

  makeAnnotationTransparent(
    annotation: Core.Annotations.WidgetAnnotation
  ): void {
    console.log("Making annotation transparent");
    const transparentColor = new this.instance.Core.Annotations.Color(
      0,
      0,
      0,
      0
    );
    annotation.backgroundColor = transparentColor;
    const border = new this.instance.Core.Annotations.Border();
    border.color = transparentColor;
    annotation.border = border;
    const font = new this.instance.Core.Annotations.Font();
    font.fillColor = transparentColor;
    annotation.font = font;
  }
}
