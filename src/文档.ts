import * as vsc from './vsc';
import { 需手工释放的文档 } from './vsc/文档基类';

interface BPMN文档提供器 {
    getText(): Promise<string>;
}

/**
 * Define the document (the data model) used for paw draw files.
 */
export class BPMN文档 extends 需手工释放的文档 {

    static async create(
        uri: vsc.Uri,
        backupId: string | undefined,
        文档提供器: BPMN文档提供器,
    ): Promise<BPMN文档 | PromiseLike<BPMN文档>> {

        // If we have a backup, read that. Otherwise read the resource from the workspace
        const dataFile = typeof backupId === 'string' ? vsc.Uri.parse(backupId) : uri;
        const text = await vsc.读文件(dataFile);
        return new BPMN文档(uri, text, 文档提供器);
    }

    private readonly _uri: vsc.Uri;

    private _text: string;
    private _edits: Array<vsc.编辑事件信息体> = [];

    private readonly _文档提供器: BPMN文档提供器;

    private constructor(
        uri: vsc.Uri,
        initialText: string,
        文档提供器: BPMN文档提供器
    ) {
        super();
        this._uri = uri;
        this._text = initialText;
        this._文档提供器 = 文档提供器;
    }

    public get uri() { return this._uri; }

    /**
     * Returns the document text
     */
    public getText(): string { return this._text; }

    /**
     * Called when the user edits the document in a webview.
     *
     * This fires an event to notify VS Code that the document has been edited.
     */
    makeEdit(edit: vsc.编辑事件信息体) {

        if (edit.idx === -1) {
            vsc.debug('document#makeEdit', 'SKIP (import)', edit);
            return;
        }

        const [
            lastEdit = { idx: -1 }
        ] = this._edits.slice(-1);

        // un- or re-doing a known edit
        if (lastEdit.idx === edit.idx) {
            vsc.debug('document#makeEdit', 'SKIP (undo/redo)', edit);
            return;
        }

        vsc.debug('document#makeEdit', edit);

        this._edits.push(edit);

        this._onDidChange.fire({
            label: 'edit',
            undo: async () => {
                vsc.debug('makeEdit#undo', edit);

                this._edits.pop();
                this._onDidChangeContent.fire({
                    undo: true
                });
            },
            redo: async () => {
                vsc.debug('makeEdit#redo', edit);

                this._edits.push(edit);
                this._onDidChangeContent.fire({
                    redo: true
                });
            }
        });
    }

    /**
     * Called by VS Code when the user saves the document.
     */
    async save(cancellation: vsc.CancellationToken): Promise<void> {
        await this.saveAs(this.uri, cancellation);
    }

    /**
     * Called by VS Code when the user saves the document to a new location.
     */
    async saveAs(targetResource: vsc.Uri, cancellation: vsc.CancellationToken): Promise<void> {
        const text = await this._文档提供器.getText();
        if (cancellation.isCancellationRequested) {
            return;
        }

        this._text = text;

        await vsc.写文件(targetResource, text);

        this._onDidRename.fire({
            oldUri: this.uri,
            newUri: targetResource
        });
    }

    /**
     * Called by VS Code when the user calls `revert` on a document.
     */
    async revert(_cancellation: vsc.CancellationToken): Promise<void> {
        const text = await vsc.读文件(this.uri);

        return this.reset(text);
    }

    /**
     * Resets document to a particular state
     */
    async reset(content: string) {

        this._text = content;
        this._edits = [];

        this._onDidChangeContent.fire({
            content
        });
    }

    /**
     * Called by VS Code to backup the edited document.
     *
     * These backups are used to implement hot exit.
     */
    async backup(destination: vsc.Uri, cancellation: vsc.CancellationToken): Promise<vsc.CustomDocumentBackup> {
        await this.saveAs(destination, cancellation);

        return {
            id: destination.toString(),
            delete: async () => {
                try {
                    await vsc.workspace.fs.delete(destination);
                } catch {

                    // noop
                }
            }
        };
    }
}

export class BPMN文档集合类 {
    private readonly _documents = new Map<string, BPMN文档>();

    remove(uri: vsc.Uri) {
        const key = uri.toString();

        return this._documents.delete(key);
    }

    add(uri: vsc.Uri, document: BPMN文档) {

        if (this.get(uri)) {
            throw new Error('document already exists');
        }

        this._documents.set(uri.toString(), document);
    }

    get(uri: vsc.Uri) {
        const key = uri.toString();

        return this._documents.get(key);
    }
}
