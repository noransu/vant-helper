import * as vscode from 'vscode';
import { HTML_CONTENT, Query, decodeDocsUri } from './app';

const config = vscode.workspace.getConfiguration('vant-helper');
const initVersion = <string>config.get('version');
/**
 * Manages webview panel
 */
export default class WebviewPanel {
  public static currentPanel: WebviewPanel | undefined;

  public static readonly viewType = 'vant-helper';

  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(uri: vscode.Uri, context: vscode.ExtensionContext) {

    // If we already have a panel, show it.
    if (WebviewPanel.currentPanel) {
      WebviewPanel.currentPanel._panel.reveal();

      const decodeUri: Query = decodeDocsUri(uri);
      WebviewPanel.currentPanel._panel.webview.postMessage({ command: decodeUri });
      return;
    }

    // create a new panel.
    const panel = vscode.window.createWebviewPanel(
      WebviewPanel.viewType,
      'Vant Helper',
      vscode.ViewColumn.Two,
      {
        // Enable javascript in the webview
        enableScripts: true,
        // Enable retainContextWhenHidden by default
        retainContextWhenHidden: true,
      }
    );

    WebviewPanel.currentPanel = new WebviewPanel(panel, context, uri);
  }

  // public static revive(panel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
  //   WebviewPanel.currentPanel = new WebviewPanel(panel, context);
  // }

  private constructor(panel: vscode.WebviewPanel, context: vscode.ExtensionContext, uri: vscode.Uri) {
    this._panel = panel;

    // Set the webview's initial html content
    this.open(panel.webview, uri);

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programatically
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Handle messages from the webview
    const webview = panel.webview;
    webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
          case 'changeVersion':
            const query: Query = {
              keyword: message.keyword
            };
            webview.html = HTML_CONTENT(query, webview, message.text);
            return;
        }
      },
      undefined,
      context.subscriptions
    )
  }

  public dispose() {
    WebviewPanel.currentPanel = undefined;

    // Clean up our resources
    this._panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  private open(webview: vscode.Webview, uri: vscode.Uri) {
    this._panel.title = 'Vant Helper';
    this._panel.webview.html = this.getHomePage(webview, uri, initVersion);
  }

  private getHomePage(webview: vscode.Webview, uri: vscode.Uri, version: string) {
    const decodeUri: Query = decodeDocsUri(uri);

    return HTML_CONTENT(decodeUri, webview, version);
  }
}
