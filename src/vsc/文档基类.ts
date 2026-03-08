
import * as vsc from '.';

/**
VSCode 文档关闭不会马上释放缓存：
  1、默认最多缓存 约 5~10 个未激活的文档（具体数量由 VS Code 动态调整），缓存满时，最久未使用的文档会被 dispose
  2、对长时间未再次使用的文档（如 >30 分钟）触发后台清理

dispose 需要清理：
  1、外部资源，如：定时器、WebSocket、文件监听
  2、内部 Disposable 对象（如 WebviewPanel、EventEmitter），且未交给 context.subscriptions
  3、引用了上面两类资源的对象
 */

export abstract class 需手工释放的文档 implements vsc.CustomDocument {
  abstract readonly uri: vsc.Uri;
  private 页面已释放 = false;

  protected 可释放对象列表: vsc.Disposable[] = [];

  public 释放页面内容(): any {
    if (this.页面已释放) {
      return;
    }
    this.页面已释放 = true;
    vsc.全部清除(this.可释放对象列表);
  }

  protected 登记可释放对象<T extends vsc.Disposable>(value: T): T {
    if (this.页面已释放) {
      value.dispose();
    } else {
      this.可释放对象列表.push(value);
    }
    return value;
  }

  protected readonly _onDidDispose = this.登记可释放对象(new vsc.EventEmitter<void>());

  /**
   * Fired when the document is disposed of.
   */
  public readonly onDidDispose = this._onDidDispose.event;

  protected readonly _onDidChangeContent = this.登记可释放对象(new vsc.EventEmitter<{
    readonly content?: string;
    readonly undo?: boolean;
    readonly redo?: boolean;
  }>());

  /**
   * Fired to notify webviews that the document has changed.
   */
  public readonly onDidChangeContent = this._onDidChangeContent.event;

  protected readonly _onDidChange = this.登记可释放对象(new vsc.EventEmitter<{
    readonly label: string;
    undo(): Thenable<void> | void;
    redo(): Thenable<void> | void
  }>());

  /**
   * Fired to tell VS Code that an edit has occurred in the document.
   *
   * This updates the document's dirty indicator.
   */
  public readonly onDidChange = this._onDidChange.event;

  protected readonly _onDidRename = this.登记可释放对象(new vsc.EventEmitter<{
    oldUri: vsc.Uri,
    newUri: vsc.Uri
  }>());

  /**
   * Fired to tell others that the document got renamed.
   *
   * This updates the document's dirty indicator.
   */
  public readonly onDidRename = this._onDidRename.event;

  /**
   * Called by VS Code when there are no more references to the document.
   *
   * This happens when all editors for it have been closed.
   */
  dispose(): void {
    this._onDidDispose.fire();
    this.释放页面内容();
  }
}
