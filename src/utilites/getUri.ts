import * as vscode from "vscode";

/**
 * Convert a file path in the extension to a webview-safe URI.
 */
export function getUri(
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
  pathList: string[]
) {
  const uri = vscode.Uri.joinPath(extensionUri, ...pathList);
  return webview.asWebviewUri(uri);
}
