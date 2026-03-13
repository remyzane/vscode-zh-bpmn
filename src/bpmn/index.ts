/* global acquireVsCodeApi */

import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';
import 'bpmn-js/dist/assets/bpmn-js.css';
import 'bpmn-js/dist/assets/diagram-js.css';

import { handleMacOsKeyboard } from './macos-keyboard';
import { modeler } from './内容';
import './样式.css';

handleMacOsKeyboard();

declare function acquireVsCodeApi(): any;

interface VSCodeAPI {
  postMessage(message: any): void;
}

interface ImportDoneEvent {
  error?: Error;
  warnings: any[];
}

interface CanvasFocusChangedEvent {
  focused: boolean;
}

interface ExtensionMessage {
  type: string;
  body?: any;
  requestId?: string;
}

interface UpdateBody {
  content?: string;
  undo?: boolean;
  redo?: boolean;
}

const vscode: VSCodeAPI = acquireVsCodeApi();

modeler.on('import.done', (event: ImportDoneEvent) => {
  return vscode.postMessage({
    type: 'import',
    error: event.error?.message,
    warnings: event.warnings.map((warning: any) => warning.message),
    idx: -1
  });
});

modeler.on('commandStack.changed', () => {
  const commandStack: any = modeler.get('commandStack');
  const stackIdx = (commandStack as any)._stackIdx;

  return vscode.postMessage({
    type: 'change',
    idx: stackIdx
  });
});

modeler.on('canvas.focus.changed', (event: CanvasFocusChangedEvent) => {
  return vscode.postMessage({
    type: 'canvas-focus-change',
    value: event.focused
  });
});

// handle messages from the extension
window.addEventListener('message', async (event: MessageEvent) => {

  const message: ExtensionMessage = event.data;

  const {
    type,
    body,
    requestId
  } = message;

  switch (type) {
    case 'init':
      if (!body?.content) {
        return modeler.createDiagram();
      } else {
        return modeler.importXML(body.content);
      }

    case 'update': {
      const updateBody: UpdateBody = body;

      if (updateBody.content) {
        return modeler.importXML(updateBody.content);
      }

      if (updateBody.undo) {
        const commandStack: any = modeler.get('commandStack');
        return (commandStack as any).undo();
      }

      if (updateBody.redo) {
        const commandStack: any = modeler.get('commandStack');
        return (commandStack as any).redo();
      }

      break;
    }

    case 'getText':
      return (modeler.saveXML({ format: true }) as Promise<{ xml: string }>).then(({ xml }) => {
        return vscode.postMessage({
          type: 'response',
          requestId,
          body: xml
        });
      });

    case 'focusCanvas':
      const canvas: any = modeler.get('canvas');
      (canvas as any).focus();
      return;

  }
});

// 实现BPMN图形复制功能
async function copySelectedElements() {
  try {
    // 获取bpmn-js内置服务
    const selection: any = modeler.get('selection');
    const elementRegistry: any = modeler.get('elementRegistry');
    const copyPaste: any = modeler.get('bpmnCopyPaste') || modeler.get('copyPaste');
    const clipboard: any = modeler.get('clipboard');

    // 获取当前选中的元素
    const selectedElements = selection.get();

    if (selectedElements.length === 0) {
      vscode.postMessage({
        type: 'copyFail',
        error: '未选中任何BPMN图形'
      });
      return;
    }

    // 使用bpmn-js的复制功能
    if (copyPaste && typeof copyPaste.copy === 'function') {
      // 调用复制功能，这会将数据存储到内部剪贴板
      copyPaste.copy(selectedElements);

      // 从内部剪贴板获取数据
      const tree = clipboard.get();

      if (tree) {
        // 直接使用内部剪贴板的数据，这应该就是bpmn-js标准格式
        const clipboardContent = `bpmn-js-clip----${JSON.stringify(tree)}`;

        // 写入系统剪贴板
        await writeToClipboard(clipboardContent);
        vscode.postMessage({ type: 'copySuccess' });
        return;
      }
    }

    // 如果复制服务不可用，手动构造数据
    // 构造符合bpmn-js浏览器版格式的数据
    const clipData: { [key: string]: any[] } = {
      0: [], // 主元素（无父节点，如 Participant、Process 等）
      1: [], // 子元素（有父节点，如 StartEvent、Task 等）
      connections: [] // 连接线（Sequence Flow等）
    };

    // 遍历选中元素，格式化数据
    selectedElements.forEach((element: any) => {
      const elementInfo = elementRegistry.get(element.id);

      // 格式化元素数据，确保字段、顺序与浏览器版复制格式完全匹配
      const formattedElement = {
        priority: 1, // 固定优先级，浏览器版默认值
        id: elementInfo.id,
        x: elementInfo.x,
        y: elementInfo.y,
        width: elementInfo.width,
        height: elementInfo.height,
        businessObject: elementInfo.businessObject, // 元素业务属性（与浏览器版一致）
        di: elementInfo.di, // 元素布局属性（与浏览器版一致）
        name: elementInfo.name || null, // 名称为空时设为 null，贴合浏览器版
        // 有父元素时添加 parent 字段（与浏览器版一致）
        ...(elementInfo.parent && elementInfo.parent.id ? { parent: elementInfo.parent.id } : {})
      };

      // 区分主元素、子元素和连接线（与浏览器版分类逻辑一致）
      if (elementInfo.type.includes('Connection')) {
        clipData.connections.push(formattedElement);
      } else if (elementInfo.parent && elementInfo.parent.id) {
        clipData[1].push(formattedElement);
      } else {
        clipData[0].push(formattedElement);
      }
    });

    // 拼接固定前缀，生成最终剪贴板内容（与浏览器版完全一致）
    const clipboardContent = `bpmn-js-clip----${JSON.stringify(clipData)}`;

    // 写入系统剪贴板（适配 VS Code Webview 环境，兼容高低版本）
    await writeToClipboard(clipboardContent);
  } catch (error) {
    console.error('复制BPMN元素失败:', error);
    vscode.postMessage({
      type: 'copyFail',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

// 将剪贴板写入操作提取为独立函数
async function writeToClipboard(content: string) {
  try {
    // 优先使用现代 Clipboard API（与浏览器版一致，异步写入）
    await navigator.clipboard.writeText(content);
    return true;
  } catch (err) {
    // 降级方案：兼容低版本 Webview（如旧版 VS Code 内置 Chromium）
    console.warn('Clipboard API 不可用，使用降级方案复制：', err);
    const textarea = document.createElement('textarea');
    textarea.value = content;
    document.body.appendChild(textarea);
    textarea.select(); // 选中内容
    const success = document.execCommand('copy'); // 执行复制
    document.body.removeChild(textarea);
    return success;
  }
}

// 监听键盘事件实现复制功能
document.addEventListener('keydown', async (e) => {
  // 检测 Ctrl+C (或 Mac 上的 Cmd+C) 复制快捷键
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
    // 检查焦点是否在画布上，避免在输入框等地方触发
    const canvasElement = document.querySelector('#canvas');
    if (document.activeElement?.id === 'canvas' ||
      canvasElement?.contains(document.activeElement) ||
      document.activeElement?.tagName === 'SVG' ||  // 画布上的SVG元素
      document.activeElement?.classList.contains('djs-container')) {  // diagram-js容器
      e.preventDefault(); // 阻止默认行为（避免复制图形内文本）
      await copySelectedElements();
    }
  }
});

// signal to VS Code that the webview is initialized
vscode.postMessage({ type: 'ready' });
