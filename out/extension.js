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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const webviewPanel_1 = require("./panel/webviewPanel");
const OPENAPI_FILENAME = "openapi.yaml";
let sessionProjectUri;
let sessionSpecUri;
async function activate(context) {
    context.subscriptions.push(vscode.commands.registerCommand("vscode-openapi-spec.start", async () => {
        vscode.window.showInformationMessage("Starting Extension");
        await ensureProjectFolder();
        await ensureSpecFileExists();
        vscode.window.showInformationMessage(`sessionProjectUri: ${sessionProjectUri}`);
        if (sessionProjectUri) {
            webviewPanel_1.WebviewPanel.render(context.extensionUri, sessionProjectUri);
        }
    }));
}
function deactivate() {
    sessionProjectUri = undefined;
    sessionSpecUri = undefined;
}
async function ensureProjectFolder() {
    vscode.window.showInformationMessage(`sessionProjectUri: ${sessionProjectUri}`);
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
            vscode.window.showErrorMessage("A project folder is required to continue.");
            return;
        }
        vscode.window.showInformationMessage(`chosen: ${chosen} ${chosen?.length}`);
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
                `servers: {}`,
            ].join("\n");
            await vscode.workspace.fs.writeFile(sessionSpecUri, Buffer.from(boilerplate, "utf8"));
        }
    }
}
//# sourceMappingURL=extension.js.map