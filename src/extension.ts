import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import * as yaml from "js-yaml";
import { WebviewPanel } from "./panel/webviewPanel";

const OPENAPI_FILENAME = "openapi.yaml";
let sessionProjectUri: vscode.Uri | undefined;
let sessionSpecUri: vscode.Uri | undefined;

export async function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("vscode-openapi-spec.start", async () => {
      vscode.window.showInformationMessage("Starting Extension");
      await ensureProjectFolder();
      await ensureSpecFileExists();
      if (sessionProjectUri) {
        WebviewPanel.render(context.extensionUri, sessionProjectUri);
      }
    })
  );
}

export function deactivate() {
  sessionProjectUri = undefined;
  sessionSpecUri = undefined;
}

async function ensureProjectFolder() {
  if (!sessionProjectUri) {
    vscode.window.showInformationMessage("Project URI does not exists");
    // Always prompt user for a project folder
    const chosen = await vscode.window.showOpenDialog({
      canSelectFiles: false,
      canSelectFolders: true,
      canSelectMany: false,
      openLabel: "Select Project Folder",
    });

    if (!chosen || chosen.length === 0) {
      vscode.window.showErrorMessage(
        "A project folder is required to continue."
      );
      return;
    }
    sessionProjectUri = chosen[0];
  }
}

async function ensureSpecFileExists() {
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
      ].join("\n");
      await vscode.workspace.fs.writeFile(
        sessionSpecUri,
        Buffer.from(boilerplate, "utf8")
      );
    }
  }
}
