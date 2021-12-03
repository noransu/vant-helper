import {
  window, commands, ViewColumn, Disposable, Uri, CancellationToken,
  workspace, CompletionItemProvider, ProviderResult,
  TextDocument, Position, CompletionItem, CompletionList, CompletionItemKind,
  SnippetString, Range, version, Webview
} from 'vscode';
import Resource from './resource';
import * as kebabCaseTAGS from '../vetur/tags.json';
import * as kebabCaseATTRS from '../vetur/attributes.json';

const prettyHTML = require('pretty');
const Path = require('path');
const fs = require('fs');

const isSupportAsWebviewUri = versionCompare(version, '1.39.0');

let TAGS = {};
for (const key in kebabCaseTAGS) {
  if (kebabCaseTAGS.hasOwnProperty(key)) {
    const tag = kebabCaseTAGS[key];
    TAGS[key] = tag;

    let camelCase = toUpperCase(key);
    TAGS[camelCase] = JSON.parse(JSON.stringify(kebabCaseTAGS[key]));
  }
}

let ATTRS = {};
for (const key in kebabCaseATTRS) {
  if (kebabCaseATTRS.hasOwnProperty(key)) {
    const element = kebabCaseATTRS[key];
    ATTRS[key] = element;
    const tagAttrs = key.split('/');
    const hasTag = tagAttrs.length > 1;
    let tag = '';
    let attr = '';
    if (hasTag) {
      tag = toUpperCase(tagAttrs[0]) + '/';
      attr = tagAttrs[1];
      ATTRS[tag + attr] = JSON.parse(JSON.stringify(element));
    }
  }
}

function toUpperCase(key: string): string {
  let camelCase = key.replace(/\-(\w)/g, function (all, letter) {
    return letter.toUpperCase();
  });
  camelCase = camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
  return camelCase;
}

function versionCompare(v1: string, v2: string): boolean {

  v1 = v1.replace(/(^\s+)|(\s+$)/gi, '');
  v2 = v2.replace(/(^\s+)|(\s+$)/gi, '');

  v1 = /\d(\.|\d)*\d/gi.exec(v1)[0];
  v2 = /\d(\.|\d)*\d/gi.exec(v2)[0];

  const arr1 = v1.split('.');
  const newArr1 = arr1.map(item => parseInt(item, 10));
  const arr2 = v2.split('.');
  const newArr2 = arr2.map(item => parseInt(item, 10));
  if (newArr1[0] > newArr2[0]) {
    return true;
  }
  if (newArr1[0] === newArr2[0]) {
    if (newArr1[1] > newArr2[1]) {
      return true;
    } if (newArr1[1] === newArr2[1]) {
      if (newArr1[2] >= newArr2[2]) {
        return true;
      }
      return false;
    }
  }
  return false;
}

export const SCHEME = 'vant-helper';

export interface Query {
  keyword: string
};

export interface TagObject {
  text: string,
  offset: number
};

export function encodeDocsUri(query?: Query): Uri {
  return Uri.parse(`${SCHEME}://search?${JSON.stringify(query)}`);
}

export function decodeDocsUri(uri: Uri): Query {
  return <Query>JSON.parse(uri.query);
}

function getWebViewContent(webview: Webview, version: string = 'v2') {
  const resourcePath = Path.join(Resource.RESOURCE_PATH, 'libs', `${version}/index.html`);
  let dirPath = Resource.RESOURCE_PATH + `/libs/${version}`
  let html = fs.readFileSync(resourcePath, 'utf-8');

  html = html.replace(/(<link.+?href="|<script.+?src=")(.+?)"/g, (m, $1, $2) => {
    return isSupportAsWebviewUri
      ? $1 + webview.asWebviewUri(Uri.file(Path.resolve(dirPath, $2))).toString() + '"'
      : $1 + Uri.file(Path.resolve(dirPath, $2)).with({ scheme: 'vscode-resource' }).toString() + '"';
  });
  return html;
}

export class App {
  private _disposable: Disposable;
  public WORD_REG: RegExp = /(-?\d*\.\d\w*)|([^\`\~\!\@\$\^\&\*\(\)\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\s]+)/gi;


  getSelectedText() {
    let editor = window.activeTextEditor;

    if (!editor) { return; }

    let selection = editor.selection;

    if (selection.isEmpty) {
      let text = [];
      let range = editor.document.getWordRangeAtPosition(selection.start, this.WORD_REG);

      return editor.document.getText(range);
    } else {
      return editor.document.getText(selection);
    }
  }

  setConfig() {
    // https://github.com/Microsoft/vscode/issues/24464
    const config = workspace.getConfiguration('editor');
    const quickSuggestions = config.get('quickSuggestions');
    if (!quickSuggestions["strings"]) {
      config.update("quickSuggestions", { "strings": true }, true);
    }
  }

  openHtml(uri: Uri, title) {
    return commands.executeCommand('vant-helper.openWebview', uri, title, ViewColumn.Two)
      .then((success) => {
      }, (reason) => {
        window.showErrorMessage(reason);
      });
  }

  openDocs(query?: Query, title = 'Vant-helper', editor = window.activeTextEditor) {
    this.openHtml(encodeDocsUri(query), title);
  }

  dispose() {
    this._disposable.dispose();
  }
}

export const HTML_CONTENT = (query: Query, webview: Webview, getVersion: string = 'v2') => {
  const filename = Path.join(__dirname, '../', 'package.json');
  const data = fs.readFileSync(filename, 'utf8');
  const content = JSON.parse(data);
  const versions = content.contributes.configuration.properties['vant-helper.version']['enum'];
  const config = workspace.getConfiguration('vant-helper');
  const language = <string>config.get('language');

  let versionText = getVersion === 'v2' ? '' : `${getVersion}/`;

  let localHtml = getWebViewContent(webview, getVersion);

  let opts = ['<select class="docs-version">'];
  let selected = '';
  versions.forEach(item => {
    selected = item === getVersion ? ' selected="selected"' : '';
    opts.push(`<option${selected} value ="${item}" class="docs-version--option">${item}</option>`);
  });
  opts.push('</select>');
  const html = opts.join('');

  const path = query.keyword;
  const style = fs.readFileSync(Path.join(Resource.RESOURCE_PATH, 'style.css'), 'utf-8');

  const onDiskFixPath = Uri.file(
    Path.join(Resource.RESOURCE_PATH, 'vant', `fix.js`)
  );
  const onDiskJQueryPath = Uri.file(
    Path.join(Resource.RESOURCE_PATH, '../node_modules/jquery/dist/jquery.min.js')
  );

  const fixPath = isSupportAsWebviewUri
    ? webview.asWebviewUri(onDiskFixPath)
    : Resource.getExtensionFileVscodeResource(onDiskFixPath);

  const jqueryPath = isSupportAsWebviewUri
    ? webview.asWebviewUri(onDiskJQueryPath)
    : Resource.getExtensionFileVscodeResource(onDiskJQueryPath);

  const componentPath = `vant/${versionText}#/${language}/${path}`;
  const href = Resource.VANT_HOME_URL;
  const iframeSrc = `${href}${componentPath}`;

  const detailVersion = ({
    'v2': '2.12.14',
    'v3': '3.0.14',
  })[getVersion];

  const notice = ({
    'zh-CN': `版本：${detailVersion} ${html}，最新版本及在线示例请在浏览器中<a href="${iframeSrc}">查看</a>`,
    'en-US': `Version: ${detailVersion} ${html}, view online examples and latest edition in <a href="${iframeSrc}">browser</a>`,
  })[language];

  const noticeScript = `<div class="docs-notice">${notice}</div>`;
  const styleScript = `<style type="text/css">${style}</style>`;
  const jqScript = `<script type="text/javascript" src="${jqueryPath}"></script>`;
  const fixScript = `<script type="text/javascript" src="${fixPath}"></script>`;
  localHtml = localHtml.replace('<!-- STYLE -->', styleScript)
    .replace('<!-- NOTICE -->', noticeScript)
    .replace('<!-- JQUERY -->', jqScript)
    .replace('<!-- FIX -->', fixScript)
    .replace('<!-- LOGIC -->', `<script>
    var vscode = acquireVsCodeApi();
    window.addEventListener('message', (e) => {
      location.hash = '/${language}';
      if(e.data.loaded) {
        var hrefArr = document.querySelectorAll(".van-doc-nav__item a");
        var mobileIframeWrap = document.querySelector('.van-doc-simulator');
        var mobileIframe = document.querySelector('.van-doc-simulator iframe');
        mobileIframeWrap.style.minHeight = '560px';
        document.querySelector('.vant-helper-loading-mask').style.display = 'none';
        document.querySelector('.vant-helper-docs-container').classList.remove('fixed');
        mobileIframe.src = 'https://vant-contrib.gitee.io/vant/mobile.html#/${language}/${path}';
        for (let index = 0; index < hrefArr.length; index++) {
          if (hrefArr[index].attributes.href.value === '#/${language}/${path}'){
            hrefArr[index].click();
          }
        }
      };
      if(e.data.command && e.data.command.keyword) {
        var hrefArr = document.querySelectorAll(".van-doc-nav__item a");
        var mobileIframe = document.querySelector('.van-doc-simulator iframe');
        mobileIframe.src = 'https://vant-contrib.gitee.io/vant/mobile.html#/${language}/' + e.data.command.keyword;
        for (let index = 0; index < hrefArr.length; index++) {
          (hrefArr[index].attributes.href.value === '#/${language}/' + e.data.command.keyword) && hrefArr[index].click();
        }
      }
    }, false);
    var options = document.querySelectorAll('.docs-version--option');
    document.querySelector('.docs-version').addEventListener('change', function(event) {
      var version = options[this.selectedIndex].value;
      vscode.postMessage({
        command: 'changeVersion',
        text: version,
        keyword: '${path}'
      })
    }, false);
  </script>`);

  return localHtml;
};

export class ElementCompletionItemProvider implements CompletionItemProvider {
  private _document: TextDocument;
  private _position: Position;
  private tagReg: RegExp = /<([\w-]+)\s*/g;
  private attrReg: RegExp = /(?:\(|\s*)(\w+)=['"][^'"]*/;
  private tagStartReg: RegExp = /<([\w-]*)$/;
  private quotes: string;

  getPreTag(): TagObject | undefined {
    let line = this._position.line;
    let tag: TagObject | string;
    let txt = this.getTextBeforePosition(this._position);

    while (this._position.line - line < 10 && line >= 0) {
      if (line !== this._position.line) {
        txt = this._document.lineAt(line).text;
      }
      tag = this.matchTag(this.tagReg, txt, line);
      if (tag === 'break') return;
      if (tag) return <TagObject>tag;
      line--;
    }
    return;
  }

  getPreAttr(): string | undefined {
    let txt = this.getTextBeforePosition(this._position).replace(/"[^'"]*(\s*)[^'"]*$/, '');
    let end = this._position.character;
    let start = txt.lastIndexOf(' ', end) + 1;
    let parsedTxt = this._document.getText(new Range(this._position.line, start, this._position.line, end));

    return this.matchAttr(this.attrReg, parsedTxt);
  }

  matchAttr(reg: RegExp, txt: string): string {
    let match: RegExpExecArray;
    match = reg.exec(txt);
    return !/"[^"]*"/.test(txt) && match && match[1];
  }

  matchTag(reg: RegExp, txt: string, line: number): TagObject | string {
    let match: RegExpExecArray;
    let arr: TagObject[] = [];

    if (/<\/?[-\w]+[^<>]*>[\s\w]*<?\s*[\w-]*$/.test(txt) || (this._position.line === line && (/^\s*[^<]+\s*>[^<\/>]*$/.test(txt) || /[^<>]*<$/.test(txt[txt.length - 1])))) {
      return 'break';
    }
    while ((match = reg.exec(txt))) {
      arr.push({
        text: match[1],
        offset: this._document.offsetAt(new Position(line, match.index))
      });
    }
    return arr.pop();
  }

  getTextBeforePosition(position: Position): string {
    var start = new Position(position.line, 0);
    var range = new Range(start, position);
    return this._document.getText(range);
  }
  getTagSuggestion() {
    let suggestions = [];

    let id = 100;
    for (let tag in TAGS) {
      suggestions.push(this.buildTagSuggestion(tag, TAGS[tag], id));
      id++;
    }
    return suggestions;
  }

  getAttrValueSuggestion(tag: string, attr: string): CompletionItem[] {
    let suggestions = [];
    const values = this.getAttrValues(tag, attr);
    values.forEach(value => {
      suggestions.push({
        label: value,
        kind: CompletionItemKind.Value
      });
    });
    return suggestions;
  }

  getAttrSuggestion(tag: string) {
    let suggestions = [];
    let tagAttrs = this.getTagAttrs(tag);
    let preText = this.getTextBeforePosition(this._position);
    let prefix = preText.replace(/['"]([^'"]*)['"]$/, '').split(/\s|\(+/).pop();
    // method attribute
    const method = prefix[0] === '@';
    // bind attribute
    const bind = prefix[0] === ':';

    prefix = prefix.replace(/[:@]/, '');

    if (/[^@:a-zA-z\s]/.test(prefix[0])) {
      return suggestions;
    }

    tagAttrs.forEach(attr => {
      const attrItem = this.getAttrItem(tag, attr);
      if (attrItem && (!prefix.trim() || this.firstCharsEqual(attr, prefix))) {
        const sug = this.buildAttrSuggestion({ attr, tag, bind, method }, attrItem);
        sug && suggestions.push(sug);
      }
    });
    for (let attr in ATTRS) {
      const attrItem = this.getAttrItem(tag, attr);
      if (attrItem && attrItem.global && (!prefix.trim() || this.firstCharsEqual(attr, prefix))) {
        const sug = this.buildAttrSuggestion({ attr, tag: null, bind, method }, attrItem);
        sug && suggestions.push(sug);
      }
    }
    return suggestions;
  }

  buildTagSuggestion(tag, tagVal, id) {
    const snippets = [];
    let index = 0;
    let that = this;
    function build(tag, { subtags, defaults }, snippets) {
      let attrs = '';
      defaults && defaults.forEach((item, i) => {
        attrs += ` ${item}=${that.quotes}$${index + i + 1}${that.quotes}`;
      });
      snippets.push(`${index > 0 ? '<' : ''}${tag}${attrs}>`);
      index++;
      subtags && subtags.forEach(item => build(item, TAGS[item], snippets));
      snippets.push(`</${tag}>`);
    };
    build(tag, tagVal, snippets);

    return {
      label: tag,
      sortText: `0${id}${tag}`,
      insertText: new SnippetString(prettyHTML('<' + snippets.join('')).substr(1)),
      kind: CompletionItemKind.Snippet,
      detail: `vant-ui ${tagVal.version ? `(version: ${tagVal.version})` : ''}`,
      documentation: tagVal.description ? tagVal.description : '',
    };
  }

  buildAttrSuggestion({ attr, tag, bind, method }, { description, type, version }) {
    if ((method && type === "method") || (bind && type !== "method") || (!method && !bind)) {
      return {
        label: attr,
        insertText: (type && (type === 'flag')) ? `${attr} ` : new SnippetString(`${attr}=${this.quotes}$1${this.quotes}$0`),
        kind: (type && (type === 'method')) ? CompletionItemKind.Method : CompletionItemKind.Property,
        detail: tag ? `<${tag}> ${version ? `(version: ${version})` : ''}` : `vant-ui ${version ? `(version: ${version})` : ''}`,
        documentation: description
      };
    } else { return; }
  }

  getAttrValues(tag, attr) {
    let attrItem = this.getAttrItem(tag, attr);
    let options = attrItem && attrItem.options;
    if (!options && attrItem) {
      if (attrItem.type === 'boolean') {
        options = ['true', 'false'];
      } else if (/icon/.test(attr)) {
        options = ATTRS['icons'];
      }
    }
    return options || [];
  }

  getTagAttrs(tag: string) {
    return (TAGS[tag] && TAGS[tag].attributes) || [];
  }

  getAttrItem(tag: string | undefined, attr: string | undefined) {
    return ATTRS[`${tag}/${attr}`] || ATTRS[attr];
  }

  isAttrValueStart(tag: Object | string | undefined, attr) {
    return tag && attr;
  }

  isAttrStart(tag: TagObject | undefined) {
    return tag;
  }

  isTagStart() {
    let txt = this.getTextBeforePosition(this._position);
    return this.tagStartReg.test(txt);
  }

  firstCharsEqual(str1: string, str2: string) {
    if (str2 && str1) {
      return str1[0].toLowerCase() === str2[0].toLowerCase();
    }
    return false;
  }
  // tentative plan for vue file
  notInTemplate(): boolean {
    let line = this._position.line;
    while (line) {
      if (/^\s*<script.*>\s*$/.test(<string>this._document.lineAt(line).text)) {
        return true;
      }
      line--;
    }
    return false;
  }

  provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken): ProviderResult<CompletionItem[] | CompletionList> {
    this._document = document;
    this._position = position;

    const config = workspace.getConfiguration('vant-helper');
    const normalQuotes = config.get('quotes') === 'double' ? '"' : "'";
    this.quotes = normalQuotes;
    let tag: TagObject | string | undefined = this.getPreTag();
    let attr = this.getPreAttr();
    if (this.isAttrValueStart(tag, attr)) {
      return this.getAttrValueSuggestion(tag.text, attr);
    } else if (this.isAttrStart(tag)) {
      return this.getAttrSuggestion(tag.text);
    } else if (this.isTagStart()) {
      switch (document.languageId) {
        case 'vue':
          return this.notInTemplate() ? [] : this.getTagSuggestion();
        case 'html':
          return this.getTagSuggestion();
      }
    } else { return []; }
  }
}
