import * as vscode from "vscode";

export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "openapiFieldsView";
  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    return /* html */ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
        </head>
        <body>
          <h3>Add OpenAPI Field</h3>
          <input id="field" placeholder="Field name"/>
          <button onclick="addField()">Add</button>

          <script>
            const vscode = acquireVsCodeApi();

            function addField() {
              const field = document.getElementById("field").value;
              vscode.postMessage({ type: "add-field", value: field });
            }
          </script>
        </body>
      </html>
    `;
  }
}
