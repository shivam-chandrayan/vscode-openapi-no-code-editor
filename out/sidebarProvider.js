"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SidebarProvider = void 0;
class SidebarProvider {
    _extensionUri;
    static viewType = "openapiFieldsView";
    _view;
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
    }
    resolveWebviewView(webviewView, _context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    }
    _getHtmlForWebview(webview) {
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
exports.SidebarProvider = SidebarProvider;
//# sourceMappingURL=sidebarProvider.js.map