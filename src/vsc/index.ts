/** VSCode 接口封装 */
import * as vsc2 from 'vscode';
// import { 语言基类, 语言配置表, 通用语言实现, 锚点配置T } from './语言';

export { window, workspace, Webview, WebviewPanel, CustomEditorProvider } from 'vscode';
export { CustomDocument, CustomDocumentBackup, CustomDocumentEditEvent, CustomDocumentBackupContext, TextDocument } from 'vscode';
export { CancellationToken, commands, Disposable, EventEmitter, ExtensionContext, TabInputText, Uri } from 'vscode';

const outputChannel = vsc2.window.createOutputChannel('BPMN 编辑器');

/** 调试输出（调试控制台输出（开发环境））（用户不可见，不内存占用）  */
export function debug(message?: any, ...optionalParams: any[]) {
    console.debug(`[${new Date().toLocaleString()}] ${message}`, ...optionalParams);
}

/** 插件输出（用户可见，少量内存占用） */
export function 输出(msg: string, args?: { 显示输出面板: boolean }) {
    outputChannel.appendLine(`[${new Date().toLocaleString()}] ${msg}`);
    if (args?.显示输出面板) {
        outputChannel.show(true);
    }
}

export async function 读文件(uri: vsc2.Uri): Promise<string> {
    if (uri.scheme === 'untitled') {
        return '';
    }
    return Buffer.from(await vsc2.workspace.fs.readFile(uri)).toString('utf8');
}

export async function 写文件(uri: vsc2.Uri, text: string): Promise<void> {
    await vsc2.workspace.fs.writeFile(uri, Buffer.from(text, 'utf8'));
}

export interface 编辑事件信息体 {
    readonly idx: number;
    readonly type: string;
}

export function 全部清除(可清除对象列表: vsc2.Disposable[]): void {
    while (可清除对象列表.length) {
        const 可清除对象 = 可清除对象列表.pop();
        if (可清除对象) {
            可清除对象.dispose();
        }
    }
}


/**
 * Tracks all webviews.
 */
export class WebviewCollection {

    private readonly _webviews = new Set<{
        readonly resource: string;
        readonly webviewPanel: vsc2.WebviewPanel;
    }>();

    /**
     * Get all known webviews for a given uri.
     */
    public *get(uri: vsc2.Uri): Iterable<vsc2.WebviewPanel> {
        const key = uri?.toString();
        for (const entry of this._webviews) {
            if (entry.resource === key) {
                yield entry.webviewPanel;
            }
        }
    }

    /**
     * Add a new webview to the collection.
     */
    public add(uri: vsc2.Uri, webviewPanel: vsc2.WebviewPanel) {
        const entry = { resource: uri.toString(), webviewPanel };
        this._webviews.add(entry);

        webviewPanel.onDidDispose(() => {
            this._webviews.delete(entry);
        });
    }

    public find(cb: (e: vsc2.WebviewPanel) => boolean) {
        for (const entry of this._webviews) {
            const { webviewPanel } = entry;

            if (cb(webviewPanel)) {
                return webviewPanel;
            }
        }

        return null;
    }
}
