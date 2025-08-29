import * as vscode from "vscode";

export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "openapi-sidebar";
  private _view?: vscode.WebviewView;

  constructor(private readonly _context: vscode.ExtensionContext) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        this._context.extensionUri
      ]
    };

    webviewView.webview.html = this.getHtml(webviewView.webview);

    // Listen to messages from webview
    webviewView.webview.onDidReceiveMessage((message) => {
      switch (message.type) {
        case "addField":
          vscode.window.showInformationMessage(
            `Added field: ${message.fieldName} = ${message.fieldValue}`
          );
          break;
      }
    });
  }

  private getHtml(webview: vscode.Webview): string {
    const nonce = getNonce();
    return /* html */ `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta http-equiv="Content-Security-Policy"
          content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
        <style>
          body { font-family: sans-serif; padding: 10px; }
          input, button { margin-top: 6px; display: block; width: 100%; }
        </style>
      </head>
      <body>
        <h3>Add Field</h3>
        <input id="fieldName" placeholder="Field name"/>
        <input id="fieldValue" placeholder="Field value"/>
        <button onclick="addField()">Add</button>

        <script nonce="${nonce}">
          const vscode = acquireVsCodeApi();
          function addField() {
            const name = document.getElementById('fieldName').value;
            const value = document.getElementById('fieldValue').value;
            vscode.postMessage({ type: 'addField', fieldName: name, fieldValue: value });
          }
        </script>
      </body>
      </html>`;
  }
}

// Utility: nonce generator
function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
