import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { OpenApiWebviewPanel } from "./panel/webviewPanel";

const OPENAPI_FILENAME = "openapi.yaml";
let sessionProjectUri: vscode.Uri | undefined;
let sessionSpecUri: vscode.Uri | undefined;

export async function activate(context: vscode.ExtensionContext) {
  // Create/open the spec file
  if (!sessionProjectUri) return;
  const specPath = path.join(sessionProjectUri.fsPath, OPENAPI_FILENAME);
  sessionSpecUri = vscode.Uri.file(specPath);

  if (!fs.existsSync(specPath)) {
    const boilerplate = [
      `openapi: "3.0.0"`,
      `info:`,
      `  title: "New API"`,
      `  version: "1.0.0"`,
      `  description: ""`,
      `paths: {}`,
      `components: {}`,
    ].join("\n");
    await vscode.workspace.fs.writeFile(
      sessionSpecUri,
      Buffer.from(boilerplate, "utf8")
    );
  }

  // Open the spec in editor
  const doc = await vscode.workspace.openTextDocument(sessionSpecUri);
  await vscode.window.showTextDocument(doc, { preview: false });

  // Show the webview beside
  OpenApiWebviewPanel.show(context, sessionProjectUri, sessionSpecUri);

  // Optional command to re-run the flow manually
  context.subscriptions.push(
    vscode.commands.registerCommand("vscode-openapi-spec.start", async () => {
      await ensureProjectFolder(context);
      if (sessionProjectUri) {
        const p = path.join(sessionProjectUri.fsPath, OPENAPI_FILENAME);
        sessionSpecUri = vscode.Uri.file(p);
        if (!fs.existsSync(p)) {
          const boilerplate = [
            `openapi: "3.0.0"`,
            `info:`,
            `  title: "New API"`,
            `  version: "1.0.0"`,
            `  description: ""`,
            `paths: {}`,
            `components: {}`,
          ].join("\n");
          await vscode.workspace.fs.writeFile(
            sessionSpecUri,
            Buffer.from(boilerplate, "utf8")
          );
        }
        const doc2 = await vscode.workspace.openTextDocument(sessionSpecUri);
        await vscode.window.showTextDocument(doc2, { preview: false });
        OpenApiWebviewPanel.show(context, sessionProjectUri, sessionSpecUri);
      }
    })
  );
}

export function deactivate() {
  sessionProjectUri = undefined;
  sessionSpecUri = undefined;
}

async function ensureProjectFolder(context: vscode.ExtensionContext) {
  // Always prompt user for a project folder
  const chosen = await vscode.window.showOpenDialog({
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: false,
    openLabel: "Select Project Folder",
  });
  if (!chosen || chosen.length === 0) {
    vscode.window.showErrorMessage("A project folder is required to continue.");
    return;
  }
  sessionProjectUri = chosen[0];
}
