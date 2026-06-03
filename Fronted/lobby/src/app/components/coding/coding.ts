import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

type SheetId = 'html-css' | 'javascript';
type EditorTab = 'html' | 'css' | 'javascript';

interface CodingSheetCard {
  id: SheetId;
  title: string;
  summary: string;
  badge: string;
}

interface HtmlCssExampleManifest {
  id: string;
  title: string;
  description: string;
  html: string;
  css: string;
}

interface JavaScriptExampleManifest {
  id: string;
  title: string;
  description: string;
  file: string;
}

@Component({
  selector: 'app-coding',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './coding.html',
  styleUrls: ['./coding.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CodingComponent {
  @ViewChild('htmlCssPreviewFrame') private htmlCssPreviewFrame?: ElementRef<HTMLIFrameElement>;
  @ViewChild('javaScriptPreviewFrame') private javaScriptPreviewFrame?: ElementRef<HTMLIFrameElement>;

  readonly sheets: CodingSheetCard[] = [
    {
      id: 'html-css',
      title: 'HTML + CSS Lab',
      summary: 'Animaciones, capas luminosas y tarjetas con vibra retro-futurista.',
      badge: 'UI',
    },
    {
      id: 'javascript',
      title: 'JavaScript Lab',
      summary: 'Templates JavaScript listos para tocar, ejecutar y convertir en mini piezas visuales.',
      badge: 'JS',
    }
  ];

  htmlCssExamples: HtmlCssExampleManifest[] = [];
  javaScriptExamples: JavaScriptExampleManifest[] = [];

  activeSheetId: SheetId = 'html-css';
  activeEditorTab: EditorTab = 'html';
  sidebarCollapsed = false;
  selectedHtmlCssId = '';
  selectedJavaScriptId = '';
  layoutHtml = '';
  layoutCss = '';
  javaScriptCode = '';
  htmlCssPreviewSrcdoc = '';
  javaScriptPreviewSrcdoc = '';
  loadingMessage = 'Cargando ejemplos...';
  loadingExamples = true;
  private previewShellHtml = '';
  private previewShellCss = '';

  constructor(
    private router: Router,
    private http: HttpClient,
    private changeDetectorRef: ChangeDetectorRef
    , private translate: TranslateService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadLibraries();
  }

  ngAfterViewInit(): void {
    this.writePreviewFrame('html-css', this.htmlCssPreviewSrcdoc);
    this.writePreviewFrame('javascript', this.javaScriptPreviewSrcdoc);
  }

  get activeSheet(): CodingSheetCard {
    return this.sheets.find((sheet) => sheet.id === this.activeSheetId) ?? this.sheets[0];
  }

  get activeLanguageTitle(): string {
    return this.activeSheet.title;
  }

  get activeHtmlCssExample(): HtmlCssExampleManifest | undefined {
    return this.htmlCssExamples.find((example) => example.id === this.selectedHtmlCssId);
  }

  get activeJavaScriptExample(): JavaScriptExampleManifest | undefined {
    return this.javaScriptExamples.find((example) => example.id === this.selectedJavaScriptId);
  }

  selectSheet(sheetId: SheetId): void {
    this.activeSheetId = sheetId;
    if (sheetId === 'html-css') {
      this.activeEditorTab = 'html';
    } else {
      this.activeEditorTab = 'javascript';
    }

    this.changeDetectorRef.markForCheck();
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    this.changeDetectorRef.markForCheck();
  }

  setEditorTab(tab: EditorTab): void {
    this.activeEditorTab = tab;
    this.changeDetectorRef.markForCheck();
  }

  async onHtmlCssSelectionChange(exampleId: string): Promise<void> {
    await this.loadHtmlCssExample(exampleId);
    this.htmlCssPreviewSrcdoc = this.buildIdlePreviewDocument(
      this.translate.instant('CODING.HTML_CSS'),
      this.translate.instant('CODING.HTML_IDLE_HINT')
    );
    this.writePreviewFrame('html-css', this.htmlCssPreviewSrcdoc);
    this.changeDetectorRef.markForCheck();
  }

  async onJavaScriptSelectionChange(exampleId: string): Promise<void> {
    await this.loadJavaScriptExample(exampleId);
    this.javaScriptPreviewSrcdoc = this.buildIdlePreviewDocument(
      this.translate.instant('CODING.JS_MODE'),
      this.translate.instant('CODING.JS_IDLE_HINT')
    );
    this.writePreviewFrame('javascript', this.javaScriptPreviewSrcdoc);
    this.changeDetectorRef.markForCheck();
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }

  downloadCode(): void {
    const content = this.activeSheetId === 'html-css'
      ? [
          `HTML/CSS example: ${this.activeHtmlCssExample?.title ?? 'Custom'}`,
          '',
          'HTML',
          '----',
          this.layoutHtml,
          '',
          'CSS',
          '---',
          this.layoutCss
        ].join('\n')
      : [
          `JavaScript example: ${this.activeJavaScriptExample?.title ?? 'Custom'}`,
          '',
          'JavaScript',
          '----------',
          this.javaScriptCode
        ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'gizmolandia-coding-pack.txt';
    link.click();
    URL.revokeObjectURL(url);
  }

  updateLayoutHtml(value: string): void {
    this.layoutHtml = value;
    this.changeDetectorRef.markForCheck();
  }

  updateLayoutCss(value: string): void {
    this.layoutCss = value;
    this.changeDetectorRef.markForCheck();
  }

  updateJavaScriptCode(value: string): void {
    this.javaScriptCode = value;
    this.changeDetectorRef.markForCheck();
  }

  executeHtmlCss(): void {
    this.htmlCssPreviewSrcdoc = this.buildPreviewDocument(
      this.activeHtmlCssExample?.title ?? 'HTML + CSS',
      this.activeHtmlCssExample?.description ?? 'Resultado del ejemplo seleccionado.',
      this.layoutHtml,
      this.layoutCss,
      'Ejecutado'
    );
    this.writePreviewFrame('html-css', this.htmlCssPreviewSrcdoc);
    this.changeDetectorRef.markForCheck();
  }

  executeJavaScript(): void {
    this.javaScriptPreviewSrcdoc = this.buildJavaScriptPreviewDocument(
      this.activeJavaScriptExample?.title ?? 'JavaScript',
      this.activeJavaScriptExample?.description ?? 'Resultado del ejemplo seleccionado.',
      this.javaScriptCode
    );
    this.writePreviewFrame('javascript', this.javaScriptPreviewSrcdoc);
    this.changeDetectorRef.markForCheck();
  }

  private async loadLibraries(): Promise<void> {
    try {
      const [htmlCssExamples, javaScriptExamples, previewShellHtml, previewShellCss] = await Promise.all([
        firstValueFrom(this.http.get<HtmlCssExampleManifest[]>('/assets/html-css-cool/manifest.json')),
        firstValueFrom(this.http.get<JavaScriptExampleManifest[]>('/assets/javascript-cool/manifest.json')),
        firstValueFrom(this.http.get('/assets/codigo/codigo.html', { responseType: 'text' })),
        firstValueFrom(this.http.get('/assets/codigo/codigo.css', { responseType: 'text' }))
      ]);

      this.htmlCssExamples = htmlCssExamples;
      this.javaScriptExamples = javaScriptExamples;
      this.previewShellHtml = previewShellHtml;
      this.previewShellCss = previewShellCss;

      if (htmlCssExamples.length > 0) {
        await this.loadHtmlCssExample(htmlCssExamples[0].id);
      }

      if (javaScriptExamples.length > 0) {
        await this.loadJavaScriptExample(javaScriptExamples[0].id);
      }

      this.htmlCssPreviewSrcdoc = this.buildIdlePreviewDocument(
        this.translate.instant('CODING.HTML_CSS'),
        this.translate.instant('CODING.HTML_IDLE_HINT')
      );
      this.javaScriptPreviewSrcdoc = this.buildIdlePreviewDocument(
        this.translate.instant('CODING.JS_MODE'),
        this.translate.instant('CODING.JS_IDLE_HINT')
      );
      this.writePreviewFrame('html-css', this.htmlCssPreviewSrcdoc);
      this.writePreviewFrame('javascript', this.javaScriptPreviewSrcdoc);

      this.loadingMessage = this.translate.instant('CODING.LOADED');
      this.changeDetectorRef.markForCheck();
    } catch {
      this.loadingMessage = this.translate.instant('CODING.LOAD_FAILED');
      this.changeDetectorRef.markForCheck();
    } finally {
      this.loadingExamples = false;
      this.changeDetectorRef.markForCheck();
    }
  }

  private async loadHtmlCssExample(exampleId: string): Promise<void> {
    const example = this.htmlCssExamples.find((candidate) => candidate.id === exampleId);
    if (!example) {
      return;
    }

    this.selectedHtmlCssId = example.id;
    this.activeSheetId = 'html-css';
    this.activeEditorTab = 'html';

    const [html, css] = await Promise.all([
      firstValueFrom(this.http.get(`/assets/html-css-cool/${example.html}`, { responseType: 'text' })),
      firstValueFrom(this.http.get(`/assets/html-css-cool/${example.css}`, { responseType: 'text' }))
    ]);

    this.layoutHtml = html;
    this.layoutCss = css;
    this.changeDetectorRef.markForCheck();
  }

  private async loadJavaScriptExample(exampleId: string): Promise<void> {
    const example = this.javaScriptExamples.find((candidate) => candidate.id === exampleId);
    if (!example) {
      return;
    }

    this.selectedJavaScriptId = example.id;
    this.activeSheetId = 'javascript';
    this.activeEditorTab = 'javascript';

    this.javaScriptCode = await firstValueFrom(this.http.get(`/assets/javascript-cool/${example.file}`, { responseType: 'text' }));
    this.changeDetectorRef.markForCheck();
  }

  private buildIdlePreviewDocument(title: string, message: string): string {
    return this.fillPreviewShell(
      title,
      message,
      title,
      `<section class="idle-card"><h2>${this.escapeHtml(this.translate.instant('CODING.JS_WAITING_TITLE'))}</h2><p>${this.escapeHtml(message)}</p></section>`,
      ''
    );
  }

  private buildPreviewDocument(title: string, message: string, html: string, css: string, kicker: string): string {
    const safeHtml = this.sanitizeHtmlFragment(html);
    const safeCss = this.sanitizeCss(css);

    return this.fillPreviewShell(
      title,
      message,
      kicker,
      `<div class="preview-content">${safeHtml}</div>`,
      `<style>${safeCss}</style>`
    );
  }

  private buildJavaScriptPreviewDocument(title: string, message: string, source: string): string {
    const runnerConfig = {
      source,
      blockedMessage: this.translate.instant('CODING.JS_SANDBOX_BLOCKED'),
      missingRunMessage: this.translate.instant('CODING.JS_BLOCKED_MESSAGE'),
      runTitle: this.translate.instant('CODING.JS_RUN_TITLE'),
      errorTitle: this.translate.instant('CODING.JS_ERROR_TITLE'),
    };

    return this.fillPreviewShell(
      title,
      message,
      'JavaScript',
      `<div id="js-output" class="js-output"><h2>${this.escapeHtml(this.translate.instant('CODING.JS_OUTPUT_TITLE'))}</h2><pre>${this.escapeHtml(this.translate.instant('CODING.JS_OUTPUT_MESSAGE'))}</pre></div>`,
      `<script>window.__GIZMO_JS_RUNNER__=${this.toSafeScriptJson(runnerConfig)};</script>
<script>
(function () {
  const config = window.__GIZMO_JS_RUNNER__;
  const code = config.source;
  const logs = [];
  const output = document.getElementById('js-output');
  const safeConsole = {
    log: function () { logs.push(Array.from(arguments).map(String).join(' ')); },
    warn: function () { logs.push('WARN: ' + Array.from(arguments).map(String).join(' ')); },
    error: function () { logs.push('ERROR: ' + Array.from(arguments).map(String).join(' ')); }
  };
  const escapePreviewText = function (value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  };

  try {
    const blocked = /\\b(window|document|globalThis|parent|top|location|history|localStorage|sessionStorage|indexedDB|fetch|XMLHttpRequest|WebSocket|navigator|process|require|eval|Function)\\b/;
    if (blocked.test(code)) {
      throw new Error(config.blockedMessage);
    }

    const moduleShim = { exports: {} };
    const runnerSource = [
      "'use strict';",
      "const window = undefined;",
      "const document = undefined;",
      "const globalThis = undefined;",
      "const parent = undefined;",
      "const top = undefined;",
      "const location = undefined;",
      "const history = undefined;",
      "const localStorage = undefined;",
      "const sessionStorage = undefined;",
      "const indexedDB = undefined;",
      "const fetch = undefined;",
      "const XMLHttpRequest = undefined;",
      "const WebSocket = undefined;",
      "const navigator = undefined;",
      "const process = undefined;",
      "const require = undefined;",
      "const Function = undefined;",
      code,
      "if (typeof run === 'function') { module.exports.run = run; }",
      "return module.exports;"
    ].join('\\n');

    const runner = new Function('exports', 'module', 'console', runnerSource);
    const exported = runner(moduleShim.exports, moduleShim, safeConsole) || moduleShim.exports;
    const run = exported.run || exported.default;
    if (typeof run !== 'function') {
      throw new Error(config.missingRunMessage);
    }

    const result = run();
    const rendered = typeof result === 'string' ? result : '<pre>' + JSON.stringify(result, null, 2) + '</pre>';
    output.innerHTML = '<h2>' + escapePreviewText(config.runTitle) + '</h2>' + rendered + (logs.length ? '<pre>' + escapePreviewText(logs.join('\\n')) + '</pre>' : '');
  } catch (error) {
    const message = String(error && error.message ? error.message : error);
    output.innerHTML = '<h2>' + escapePreviewText(config.errorTitle) + '</h2><p class="js-error">' + escapePreviewText(message) + '</p>';
  }
})();
</script>`
    );
  }

  private fillPreviewShell(title: string, message: string, kicker: string, content: string, extra: string): string {
    return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>${this.previewShellCss}</style>
  </head>
  <body>${this.previewShellHtml
      .replaceAll('__TITLE__', this.escapeHtml(title))
      .replaceAll('__MESSAGE__', this.escapeHtml(message))
      .replaceAll('__KICKER__', this.escapeHtml(kicker))
      .replaceAll('__CONTENT__', content)
      .replaceAll('__EXTRA__', extra)}</body>
</html>`;
  }

  private writePreviewFrame(mode: SheetId, srcdoc: string): void {
    const frame = mode === 'html-css' ? this.htmlCssPreviewFrame : this.javaScriptPreviewFrame;
    if (!frame) {
      return;
    }

    frame.nativeElement.srcdoc = srcdoc;
  }

  private defaultPreviewShellHtml(): string {
    return '';
  }

  private defaultPreviewShellCss(): string {
    return '';
  }

  private sanitizeHtmlFragment(value: string): string {
    const template = document.createElement('template');
    template.innerHTML = value;

    this.removeUnsafeNodes(template.content);
    this.removeUnsafeAttributes(template.content);

    return template.innerHTML;
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  private removeUnsafeNodes(root: ParentNode): void {
    root.querySelectorAll('script[src], iframe, object, embed, link[rel="import"], meta[http-equiv="refresh"]').forEach((node) => node.remove());
  }

  private removeUnsafeAttributes(root: ParentNode): void {
    root.querySelectorAll('*').forEach((element) => {
      Array.from(element.attributes).forEach((attribute) => {
        const name = attribute.name.toLowerCase();
        const value = attribute.value.trim().toLowerCase();

        if ((name === 'src' || name === 'href' || name === 'xlink:href') && value.startsWith('javascript:')) {
          element.removeAttribute(attribute.name);
        }
      });
    });
  }

  private sanitizeCss(value: string): string {
    return value
      .replace(/@import[^;]*;/gi, '')
      .replace(/expression\s*\(/gi, '(')
      .replace(/url\((['"]?)\s*javascript:/gi, 'url($1about:blank')
      .replace(/<\/style/gi, '<\\/style');
  }

  private toSafeScriptJson(value: unknown): string {
    return JSON.stringify(value)
      .replace(/</g, '\\u003C')
      .replace(/>/g, '\\u003E')
      .replace(/&/g, '\\u0026')
      .replace(/\u2028/g, '\\u2028')
      .replace(/\u2029/g, '\\u2029');
  }

}
