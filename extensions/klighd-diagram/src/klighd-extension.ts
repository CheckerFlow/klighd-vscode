/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2021 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This code is provided under the terms of the Eclipse Public License (EPL).
 */
import { ExtensionContext, Uri, commands } from "vscode";
import {
    SprottyDiagramIdentifier,
    SprottyLspVscodeExtension,
    SprottyLspWebview,
} from "sprotty-vscode/lib/lsp";
import { SprottyWebview } from "sprotty-vscode";
import { CenterAction, FitToScreenAction, RequestExportSvgAction } from "sprotty";
import { LanguageClient } from "vscode-languageclient";
import { diagramType, extensionId } from "./constants";

/**
 * Bootstrap an extension with `sprotty-vscode` that manages a webview which
 * contains a Sprotty container to display diagrams.
 *
 * @see https://github.com/eclipse/sprotty-vscode
 */
export class KLighDExtension extends SprottyLspVscodeExtension {
    // Ideally this should be an instance property and not a static field. However,
    // SprottyLspVscodeExtension calls activateLanguageClient in its constructor
    // which happens before an instance property would be assigned by our
    // constructor, since the super call has to be the first expression in the
    // constructor.
    static lsClient: LanguageClient;
    private supportedFileEndings: string[];

    constructor(context: ExtensionContext, supportedFileEnding: string[]) {
        super(extensionId, context);
        this.supportedFileEndings = supportedFileEnding;
    }

    protected createWebView(identifier: SprottyDiagramIdentifier): SprottyWebview {
        const webview = new SprottyLspWebview({
            extension: this,
            identifier,
            localResourceRoots: [this.getExtensionFileUri("dist")],
            scriptUri: this.getExtensionFileUri("dist", "webview.js"),
            singleton: true,
        });

        return webview;
    }

    /**
     * `commandArgs` are the args passed to the diagram open command.
     * Only returning a diagramType for support fileEndings (defined by host extension)
     * prevents the webview content from changing if an unsupported editor is focused,
     * while the diagram view is open.
     *
     * For example: Focusing the output/task panel causes the webview to update and
     * trying to render a model in the clearly unsupported situation.
     */
    protected getDiagramType(commandArgs: any[]): string | Promise<string | undefined> | undefined {
        if (commandArgs[0] instanceof Uri && this.pathHasSupportedFileEnding(commandArgs[0].path)) {
            return diagramType;
        }
        return undefined;
    }

    private pathHasSupportedFileEnding(path: string) {
        return this.supportedFileEndings.some((ending) => path.endsWith(ending));
    }

    protected activateLanguageClient(_: ExtensionContext): LanguageClient {
        // This extension does not manage any language clients. It receives it's
        // clients from a host extension. See the "setLanguageClient" command.
        return KLighDExtension.lsClient;
    }

    /** Overwrite register from {@link SprottyLspVscodeExtension} commands to
     * fix zooming problems with diagram.fit when an element is selected.
     *
     * _Note: This can not call the super implementation since VSCode is not able
     * to overwrite commands and would throw an error._
     */
    protected registerCommands() {
        this.context.subscriptions.push(
            commands.registerCommand(
                this.extensionPrefix + ".diagram.open",
                async (...commandArgs: any[]) => {
                    const identifier = await this.createDiagramIdentifier(commandArgs);
                    if (identifier) {
                        const key = this.getKey(identifier);
                        let webView = this.singleton || this.webviewMap.get(key);
                        if (webView) {
                            webView.reloadContent(identifier);
                            webView.diagramPanel.reveal(webView.diagramPanel.viewColumn);
                        } else {
                            webView = this.createWebView(identifier);
                            this.webviewMap.set(key, webView);
                            if (webView.singleton) {
                                this.singleton = webView;
                            }
                        }
                    }
                }
            )
        );
        this.context.subscriptions.push(
            commands.registerCommand(this.extensionPrefix + ".diagram.fit", () => {
                const activeWebview = this.findActiveWebview();
                if (activeWebview) {
                    activeWebview.dispatch(new FitToScreenAction(["$root"], 10, undefined, true));
                }
            })
        );
        this.context.subscriptions.push(
            commands.registerCommand(this.extensionPrefix + ".diagram.center", () => {
                const activeWebview = this.findActiveWebview();
                if (activeWebview) {
                    activeWebview.dispatch(new CenterAction([], true));
                }
            })
        );
        this.context.subscriptions.push(
            commands.registerCommand(this.extensionPrefix + ".diagram.export", () => {
                const activeWebview = this.findActiveWebview();
                if (activeWebview) {
                    activeWebview.dispatch(new RequestExportSvgAction());
                }
            })
        );
    }
}
