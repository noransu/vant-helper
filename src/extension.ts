'use strict';

import * as vscode from 'vscode';
import { App, ElementDocsContentProvider, SCHEME, ElementCompletionItemProvider, webViewPanel } from './app';
import Library from './library';

export function activate(context: vscode.ExtensionContext) {
	let library = new Library(context);
	let app = new App();
	app.setConfig();
	let docs = new ElementDocsContentProvider();
	let completionItemProvider = new ElementCompletionItemProvider();
	let registration = vscode.workspace.registerTextDocumentContentProvider(SCHEME, docs);

	let completion = vscode.languages.registerCompletionItemProvider([{
		language: 'vue', scheme: 'file'
	}, {
		language: 'html', scheme: 'file'
	}],
		completionItemProvider, ' ', '', ':', '<', '"', "'", '/', '@', '(');
	let vueLanguageConfig = vscode.languages.setLanguageConfiguration('vue', { wordPattern: app.WORD_REG });

	let disposable = vscode.commands.registerCommand('vant-helper.searchUnderCursor', () => {
		if (context.workspaceState.get('vant-helper.loading', false)) {
			vscode.window.showInformationMessage('Document is initializing, please wait a minute depend on your network.');
			return;
		}

		switch (vscode.window.activeTextEditor.document.languageId) {
			case 'vue':
			case 'html':
				break;
			default:
				return;
		}

		const selection = app.getSelectedText();
		let items = library.queryAll().map(item => {
			return {
				label: item.tag,
				detail: item.name,
				path: item.path,
				description: item.type
			};
		});
		if (items.length < 1) {
			vscode.window.showInformationMessage('Initializing。。。, please try again.');
			return;
		}

		let find = items.filter(item => item.label === selection);
		if (find.length) {
			app.openDocs({ keyword: find[0].path }, find[0].label);
			return;
		}

		// cant set default value for this method? angry.
		const a = vscode.window.showQuickPick(items).then(selected => {
			selected && app.openDocs({ keyword: selected.path }, selected.label);
		});
	});

	let disposable2 = vscode.commands.registerCommand('vant-helper.openWebview', (uri) => {
		webViewPanel(uri, context);
	});

	context.subscriptions.push(app, disposable, disposable2, registration, completion, vueLanguageConfig);
}

// this method is called when your extension is deactivated
export function deactivate() {
}

