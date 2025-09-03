import {
  Disposable,
  Webview,
  WebviewPanel as VSWebviewPanel,
  window,
  Uri,
  ViewColumn,
} from "vscode";
import * as vscode from "vscode";
import { getUri } from "../utilites/getUri";
import { getNonce } from "../utilites/getNonce";
import * as yaml from "js-yaml";

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
export class WebviewPanel {
  public static currentPanel: WebviewPanel | undefined;
  private readonly _panel: VSWebviewPanel;
  private _disposables: Disposable[] = [];
  private _projectUri: Uri;

  /**
   * The WebviewPanel class private constructor (called only from the render method).
   *
   * @param panel A reference to the webview panel
   * @param extensionUri The URI of the directory containing the extension
   */
  private constructor(
    panel: VSWebviewPanel,
    extensionUri: Uri,
    projectUri: Uri
  ) {
    this._panel = panel;
    this._projectUri = projectUri;

    // Set an event listener to listen for when the panel is disposed (i.e. when the user closes
    // the panel or when the panel is closed programmatically)
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Set the HTML content for the webview panel
    this._panel.webview.html = this._getWebviewContent(
      this._panel.webview,
      extensionUri
    );

    // Set an event listener to listen for messages passed from the webview context
    this._setWebviewMessageListener(this._panel.webview);
  }

  /**
   * Renders the current webview panel if it exists otherwise a new webview panel
   * will be created and displayed.
   *
   * @param extensionUri The URI of the directory containing the extension.
   */
  public static render(extensionUri: Uri, projectUri: Uri) {
    if (WebviewPanel.currentPanel) {
      // If the webview panel already exists reveal it
      WebviewPanel.currentPanel._panel.reveal(ViewColumn.One);
    } else {
      // If a webview panel does not already exist create and show a new one
      const panel = window.createWebviewPanel(
        // Panel view type
        "mapsPanel",
        // Panel title
        "VSCode Maps",
        // The editor column the panel should be displayed in
        ViewColumn.One,
        // Extra panel configurations
        {
          // Enable JavaScript in the webview
          enableScripts: true,
          retainContextWhenHidden: true,
          // Restrict the webview to only load resources from the `out` and `webview-ui/build` directories
          localResourceRoots: [
            Uri.joinPath(extensionUri, "out"),
            Uri.joinPath(extensionUri, "webview-ui/build"),
          ],
        }
      );

      WebviewPanel.currentPanel = new WebviewPanel(
        panel,
        extensionUri,
        projectUri
      );

      const watcher = vscode.workspace.createFileSystemWatcher(
        new vscode.RelativePattern(projectUri, "openapi.yaml")
      );

      watcher.onDidChange(() => {
        WebviewPanel.currentPanel?._readSpecFileAndSend();
      });

      panel.onDidDispose(() => {
        watcher.dispose();
      });
    }
  }

  /**
   * Cleans up and disposes of webview resources when the webview panel is closed.
   */
  public dispose() {
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
  private _getWebviewContent(webview: Webview, extensionUri: Uri) {
    // The CSS file from the React build output
    const stylesUri = getUri(webview, extensionUri, [
      "webview-ui",
      "build",
      "assets",
      "index.css",
    ]);
    // The JS file from the React build output
    const scriptUri = getUri(webview, extensionUri, [
      "webview-ui",
      "build",
      "assets",
      "index.js",
    ]);

    const nonce = getNonce();

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

  saveAndOpenOpenAPISpec = async (
    context: vscode.ExtensionContext,
    data: string
  ) => {
    // check if we already have a saved file
    const savedUri = context.workspaceState.get<string>("openApiFileUri");

    if (savedUri) {
      try {
        const uri = vscode.Uri.parse(savedUri);
        await vscode.workspace.fs.writeFile(uri, Buffer.from(data, "utf-8"));

        const doc = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(doc, { preview: false });
        return;
      } catch (err) {
        vscode.window.showWarningMessage(
          "Saved file not found, please choose a new location."
        );
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
  private _setWebviewMessageListener(webview: Webview) {
    webview.onDidReceiveMessage(
      async (message: any) => {
        const { command, payload } = message;

        switch (command) {
          case "ready":
            // Code that should run in response to the hello message command
            webview.postMessage({
              command: "init state",
              payload: {
                specData: {
                  openapi: "3.0.0",
                  info: { title: "New API", description: "", version: "1.0.0" },
                  servers: [],
                },
              },
            });

            this._readSpecFileAndSend();
            return;

          case "writeSpecToFile":
            // updatingFromWebview = true;
            if (this._projectUri) {
              const { specData } = payload;
              const yamlString = yaml.dump(specData);
              const fileUri = vscode.Uri.joinPath(
                this._projectUri,
                "openapi.yaml"
              );
              try {
                await vscode.workspace.fs.writeFile(
                  fileUri,
                  Buffer.from(yamlString, "utf8")
                );
              } catch (err: any) {
                window.showErrorMessage(
                  `❌ Failed to write file: ${err.message}`
                );
                console.error(err);
              }
              window.showInformationMessage(`Data written to file`);
            }
            // updatingFromWebview = false;

            return;
        }
      },
      undefined,
      this._disposables
    );
  }

  private async _readSpecFileAndSend() {
    try {
      const fileUri = vscode.Uri.joinPath(this._projectUri, "openapi.yaml");
      const fileData = await vscode.workspace.fs.readFile(fileUri);
      const fileContent = fileData.toString();

      // Convert YAML -> JS object
      const specObject = yaml.load(fileContent);

      // Send to webview
      WebviewPanel.currentPanel?._panel.webview.postMessage({
        command: "loadSpecInWebview",
        payload: specObject,
      });
    } catch (err) {
      vscode.window.showErrorMessage(`Failed to read spec file: ${err}`);
    }
  }
}
