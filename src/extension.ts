import * as vscode from "vscode";
import { SidebarProvider } from "./sidebarProvider";
import { WebviewPanel } from "./panel/webviewPanel";

export function activate(context: vscode.ExtensionContext) {
  const provider = new SidebarProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      SidebarProvider.viewType,
      provider
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("vscode-openapi-spec.open-editor", () => {
      WebviewPanel.render(context, false);
    })
  );
}
