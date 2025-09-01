import * as vscode from "vscode";
import { getNonce } from "../utilites/getNonce";
import { getUri } from "../utilites/getUri";

type SyncState = {
  projectUri?: vscode.Uri;
  specUri?: vscode.Uri;
  updatingFromWebview: boolean;
};

export class OpenApiWebviewPanel {
  public static currentPanel: OpenApiWebviewPanel | undefined;

  private readonly panel: vscode.WebviewPanel;
  private readonly disposables: vscode.Disposable[] = [];
  private syncState: SyncState = { updatingFromWebview: false };

  constructor(
    panel: vscode.WebviewPanel,
    private readonly context: vscode.ExtensionContext,
    private readonly projectUri: vscode.Uri,
    private readonly specUri: vscode.Uri
  ) {
    this.panel = panel;
    this.syncState.projectUri = projectUri;
    this.syncState.specUri = specUri;

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    this.panel.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri],
    };
    this.panel.webview.html = this.getHtml(this.panel.webview);

    this.setMessageListeners();
    this.bootstrapInitialSpec();

    // Listen to file changes → push to webview
    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument((e) => {
        if (!this.syncState.specUri) return;
        if (e.document.uri.toString() !== this.syncState.specUri.toString())
          return;
        if (this.syncState.updatingFromWebview) return; // ignore echo

        this.panel.webview.postMessage({
          type: "specUpdated",
          content: e.document.getText(),
        });
      })
    );
  }

  public static show(
    context: vscode.ExtensionContext,
    projectUri: vscode.Uri,
    specUri: vscode.Uri
  ) {
    if (OpenApiWebviewPanel.currentPanel) {
      OpenApiWebviewPanel.currentPanel.panel.reveal(vscode.ViewColumn.Beside);
      return;
    }
    const panel = vscode.window.createWebviewPanel(
      "openapiWebview",
      "OpenAPI Editor",
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [context.extensionUri],
      }
    );
    OpenApiWebviewPanel.currentPanel = new OpenApiWebviewPanel(
      panel,
      context,
      projectUri,
      specUri
    );
  }

  private async bootstrapInitialSpec() {
    const doc = await vscode.workspace.openTextDocument(this.specUri!);
    this.panel.webview.postMessage({
      type: "specUpdated",
      content: doc.getText(),
    });
  }

  private setMessageListeners() {
    this.panel.webview.onDidReceiveMessage(
      async (msg) => {
        switch (msg.type) {
          case "ready":
            // send latest content again in case webview reloaded
            if (this.syncState.specUri) {
              const doc = await vscode.workspace.openTextDocument(
                this.syncState.specUri
              );
              this.panel.webview.postMessage({
                type: "specUpdated",
                content: doc.getText(),
              });
            }
            break;

          case "updateSpec":
            // Webview → File (debounced in webview, but keep loop guard here too)
            if (!this.syncState.specUri) return;
            this.syncState.updatingFromWebview = true;
            try {
              await vscode.workspace.fs.writeFile(
                this.syncState.specUri,
                Buffer.from(msg.content, "utf8")
              );
              // Reveal/open if not visible
              const doc = await vscode.workspace.openTextDocument(
                this.syncState.specUri
              );
              await vscode.window.showTextDocument(doc, { preview: false });
            } finally {
              // Small timeout to ensure onDidChangeTextDocument fires and we ignore it
              setTimeout(
                () => (this.syncState.updatingFromWebview = false),
                50
              );
            }
            break;
        }
      },
      undefined,
      this.disposables
    );
  }

  private getHtml(webview: vscode.Webview) {
    const nonce = getNonce();
    const scriptUri = getUri(webview, this.context.extensionUri, [
      "media",
      "webview.js",
    ]);
    const style = `
      body { font-family: ui-sans-serif, system-ui, -apple-system; padding: 12px; }
      .row { margin-bottom: 10px; display: flex; gap: 8px; align-items: center; }
      label { min-width: 80px; }
      input, textarea { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px; }
      .muted { color: #666; font-size: 12px; }
      .grid { display: grid; gap: 10px; grid-template-columns: 1fr 1fr; }
      .card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px; }
      .title { font-weight: 600; font-size: 14px; margin-bottom: 6px; }
    `;
    // Use external HTML file? You can inline; here we reference media/webview.js only.
    return /* html */ `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8"/>
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource}; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <title>OpenAPI UI</title>
          <style>${style}</style>
        </head>
        <body>
          <div class="grid">
            <div class="card">
              <div class="title">OpenAPI Info</div>
              <div class="row"><label>Title</label><input id="apiTitle" placeholder="API title"/></div>
              <div class="row"><label>Version</label><input id="apiVersion" placeholder="1.0.0"/></div>
              <div class="row"><label>Desc</label><input id="apiDesc" placeholder="Short description"/></div>
              <p class="muted">Edits here update <code>openapi.yaml</code> automatically.</p>
            </div>
            <div class="card">
              <div class="title">Raw YAML (live)</div>
              <textarea id="raw" rows="18" spellcheck="false"></textarea>
              <p class="muted">Editing raw YAML also updates the file.</p>
            </div>
          </div>
          <script nonce="${nonce}" src="${scriptUri}"></script>
        </body>
      </html>
    `;
  }

  public dispose() {
    OpenApiWebviewPanel.currentPanel = undefined;
    this.panel.dispose();
    while (this.disposables.length) {
      const d = this.disposables.pop();
      try {
        d?.dispose();
      } catch {}
    }
  }
}
