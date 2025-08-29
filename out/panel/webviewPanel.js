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
exports.WebviewPanel = void 0;
const vscode_1 = require("vscode");
const vscode = __importStar(require("vscode"));
const utilities_1 = require("../utilities");
const utilities_2 = require("../utilities");
/**
 * This class manages the state and behavior of HelloWorld webview panels.
 *
 * It contains all the data and methods for:
 *
 * - Creating and rendering HelloWorld webview panels
 * - Properly cleaning up and disposing of webview resources when the panel is closed
 * - Setting the HTML (and by proxy CSS/JavaScript) content of the webview panel
 * - Setting message listeners so data can be passed between the webview and extension
 */
class WebviewPanel {
    static currentPanel;
    _panel;
    _context;
    _disposables = [];
    /**
     * The WebviewPanel class private constructor (called only from the render method).
     *
     * @param panel A reference to the webview panel
     * @param extensionUri The URI of the directory containing the extension
     */
    constructor(panel, extensionUri, context) {
        this._panel = panel;
        // Set an event listener to listen for when the panel is disposed (i.e. when the user closes
        // the panel or when the panel is closed programmatically)
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        // Set the HTML content for the webview panel
        this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri);
        this._context = context;
        // Set an event listener to listen for messages passed from the webview context
        this._setWebviewMessageListener(this._panel.webview);
    }
    /**
     * Renders the current webview panel if it exists otherwise a new webview panel
     * will be created and displayed.
     *
     * @param extensionUri The URI of the directory containing the extension.
     */
    static render(context, viewRF = false) {
        if (WebviewPanel.currentPanel) {
            // If the webview panel already exists reveal it
            WebviewPanel.currentPanel._panel.reveal(vscode_1.ViewColumn.One);
            WebviewPanel.currentPanel._panel.webview.postMessage({
                command: "init",
                state: { count: 42, viewRF },
            });
        }
        else {
            // If a webview panel does not already exist create and show a new one
            const panel = vscode_1.window.createWebviewPanel(
            // Panel view type
            "mapsPanel", 
            // Panel title
            "VSCode Maps", 
            // The editor column the panel should be displayed in
            vscode_1.ViewColumn.One, 
            // Extra panel configurations
            {
                // Enable JavaScript in the webview
                enableScripts: true,
                retainContextWhenHidden: true,
                // Restrict the webview to only load resources from the `out` and `webview-ui/build` directories
                localResourceRoots: [
                    vscode_1.Uri.joinPath(context.extensionUri, "out"),
                    vscode_1.Uri.joinPath(context.extensionUri, "webview-ui/build"),
                ],
            });
            WebviewPanel.currentPanel = new WebviewPanel(panel, context.extensionUri, context);
            panel.webview.postMessage({
                command: "init",
                state: { count: 42, viewRF },
            });
        }
    }
    /**
     * Cleans up and disposes of webview resources when the webview panel is closed.
     */
    dispose() {
        WebviewPanel.currentPanel = undefined;
        // Dispose of the current webview panel
        this._panel.dispose();
        // Dispose of all disposables (i.e. commands) for the current webview panel
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
    /**
     * Defines and returns the HTML that should be rendered within the webview panel.
     *
     * @remarks This is also the place where references to the React webview build files
     * are created and inserted into the webview HTML.
     *
     * @param webview A reference to the extension webview
     * @param extensionUri The URI of the directory containing the extension
     * @returns A template string literal containing the HTML that should be
     * rendered within the webview panel
     */
    _getWebviewContent(webview, extensionUri) {
        // The CSS file from the React build output
        const stylesUri = (0, utilities_1.getUri)(webview, extensionUri, [
            "webview-ui",
            "build",
            "assets",
            "index.css",
        ]);
        // The JS file from the React build output
        const scriptUri = (0, utilities_1.getUri)(webview, extensionUri, [
            "webview-ui",
            "build",
            "assets",
            "index.js",
        ]);
        const nonce = (0, utilities_2.getNonce)();
        // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
        return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
          <link rel="stylesheet" type="text/css" href="${stylesUri}">
          <title>VSCode Maps</title>
        </head>
        <body>
          <div id="root"></div>
          <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
        </body>
      </html>
    `;
    }
    saveAndOpenOpenAPISpec = async (context, data) => {
        // check if we already have a saved file
        const savedUri = context.workspaceState.get("openApiFileUri");
        if (savedUri) {
            try {
                const uri = vscode.Uri.parse(savedUri);
                await vscode.workspace.fs.writeFile(uri, Buffer.from(data, "utf-8"));
                const doc = await vscode.workspace.openTextDocument(uri);
                await vscode.window.showTextDocument(doc, { preview: false });
                return;
            }
            catch (err) {
                vscode.window.showWarningMessage("Saved file not found, please choose a new location.");
            }
        }
        // If no saved file or error, prompt user
        const uri = await vscode.window.showSaveDialog({
            filters: { YAML: ["yaml", "yml"] },
            saveLabel: "Save OpenAPI Spec",
        });
        if (!uri) {
            return; // user cancelled
        }
        await vscode.workspace.fs.writeFile(uri, Buffer.from(data, "utf-8"));
        // persist the location for future
        await context.workspaceState.update("openApiFileUri", uri.toString());
        const doc = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(doc, { preview: false });
    };
    /**
     * Sets up an event listener to listen for messages passed from the webview context and
     * executes code based on the message that is recieved.
     *
     * @param webview A reference to the extension webview
     * @param context A reference to the extension context
     */
    _setWebviewMessageListener(webview) {
        webview.onDidReceiveMessage(async (message) => {
            const command = message.command;
            const text = message.text;
            const state = message.state;
            switch (command) {
                case "ready":
                    // Code that should run in response to the hello message command
                    vscode_1.window.showInformationMessage(text);
                    // this._panel.webview.postMessage({
                    //   command: "init",
                    //   state: { count: 42 },
                    // });
                    return;
                case "saveToWorkspace":
                    const specData = message.value;
                    this.saveAndOpenOpenAPISpec(this._context, specData);
                // const workspaceFolders = vscode.workspace.workspaceFolders;
                // if (!workspaceFolders) {
                //   vscode.window.showErrorMessage("No workspace folder open.");
                //   return;
                // }
                // const folderUri = workspaceFolders[0].uri;
                // const fileUri = vscode.Uri.joinPath(folderUri, "openapi-spec.json");
                // await vscode.workspace.fs.writeFile(
                //   fileUri,
                //   Buffer.from(JSON.stringify(specData, null, 2), "utf8")
                // );
                // vscode.window.showInformationMessage(
                //   "OpenAPI spec saved to workspace!"
                // );
            }
        }, undefined, this._disposables);
    }
}
exports.WebviewPanel = WebviewPanel;
//# sourceMappingURL=webviewPanel.js.map