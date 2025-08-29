"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SidebarProvider = void 0;
const vscode = __importStar(require("vscode"));
class SidebarProvider {
    _context;
    static viewType = "openapi-sidebar";
    _view;
    constructor(_context) {
        this._context = _context;
    }
    resolveWebviewView(webviewView, context, _token) {
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
                    vscode.window.showInformationMessage(`Added field: ${message.fieldName} = ${message.fieldValue}`);
                    break;
            }
        });
    }
    getHtml(webview) {
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
exports.SidebarProvider = SidebarProvider;
// Utility: nonce generator
function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
//# sourceMappingURL=sidebar.js.map