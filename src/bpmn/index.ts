/* global acquireVsCodeApi */

import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';
import 'bpmn-js/dist/assets/bpmn-js.css';
import 'bpmn-js/dist/assets/diagram-js.css';

import './样式.css';

import BpmnModeler from 'bpmn-js/lib/Modeler';

import BpmnColorPickerModule from 'bpmn-js-color-picker';
// import 中文翻译 from '../i18n';

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

// 配置完整的模型器选项，包括所有必要的模块
const modelerOptions: any = {
  container: '#canvas',
  additionalModules: [
    BpmnColorPickerModule,
    // { translate: ['value', 中文翻译] }
  ]
};

const modeler = new BpmnModeler(modelerOptions);

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

// signal to VS Code that the webview is initialized
vscode.postMessage({ type: 'ready' });
