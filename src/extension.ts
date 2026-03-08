import * as vsc from './vsc';
import { BPMN编辑器 } from './编辑器';

// 扩展激活时调用
export function activate(context: vsc.ExtensionContext) {
	try {
		vsc.输出('BPMN 编辑器');

		const bpmnEditor = vsc.window.registerCustomEditorProvider(
			'chinese.bpmnEditor',
			new BPMN编辑器(context),
			{
				webviewOptions: {
					retainContextWhenHidden: true,
				},
				supportsMultipleEditorsPerDocument: false
			}
		);

		context.subscriptions.push(bpmnEditor);

		vsc.输出('插件已启动');
	} catch (e) {
		vsc.window.showInformationMessage('启动失败：' + e);
	}
}

// 扩展停用时调用
export function deactivate() { }
