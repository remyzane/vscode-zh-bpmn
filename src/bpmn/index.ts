/* global acquireVsCodeApi */

import { createReviver } from "bpmn-js-native-copy-paste/lib/PasteUtil.js";
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';
import 'bpmn-js/dist/assets/bpmn-js.css';
import 'bpmn-js/dist/assets/diagram-js.css';
import { handleMacOsKeyboard } from './macos-keyboard';
import { ClipboardQuery, createResolver, GetClipboardCommand, SetClipboardCommand } from './utils';
import { modeler } from './内容';
import './样式.css';
export { ClipboardQuery, createResolver, GetClipboardCommand, SetClipboardCommand };

handleMacOsKeyboard();

interface VSCodeAPI {
  postMessage(message: any): void;
}

declare function acquireVsCodeApi(): any;
const vsc_api: VSCodeAPI = acquireVsCodeApi();

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

modeler.on('import.done', (event: ImportDoneEvent) => {
  return vsc_api.postMessage({
    type: 'import',
    error: event.error?.message,
    warnings: event.warnings.map((warning: any) => warning.message),
    idx: -1
  });
});

modeler.on('commandStack.changed', () => {
  const commandStack: any = modeler.get('commandStack');
  const stackIdx = (commandStack as any)._stackIdx;

  return vsc_api.postMessage({
    type: 'change',
    idx: stackIdx
  });
});

modeler.on('canvas.focus.changed', (event: CanvasFocusChangedEvent) => {
  return vsc_api.postMessage({
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
        return vsc_api.postMessage({
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

const eventBus = modeler.get("eventBus");
const copyPaste = modeler.get("copyPaste");
const moddle = modeler.get("moddle");
let clipboardResolver = createResolver<ClipboardQuery>();

const CLIP_PREFIX = "bpmn-js-clip----";

const requestClipboard = async () => {
  clipboardResolver = createResolver<ClipboardQuery>();
  vsc_api.postMessage(new GetClipboardCommand());
  const q = await clipboardResolver.wait();
  return q?.text ?? "";
};
const writeClipboard = (text: any) => vsc_api.postMessage(new SetClipboardCommand(text));

// ── Copy interceptor ─────────────────────────────────────────────
eventBus.on("copyPaste.elementsCopied", 2051, (context: any) => {
  const serialized = CLIP_PREFIX + JSON.stringify(context.tree);
  writeClipboard(serialized);
  context.hints = context.hints || {};
  context.hints.clip = false;
});

// ── Paste interceptor ────────────────────────────────────────────
eventBus.on("copyPaste.pasteElements", 2051, (context: any) => {
  if (context.tree) {
    return;
  }

  // Snapshot context NOW, before `return false` calls preventDefault()
  // which sets `defaultPrevented: true` on the same object.  If we spread
  // `context` asynchronously after that, the new pasteEvent inherits
  // `defaultPrevented: true` and CopyPaste.paste() sees canPaste===false,
  // silently aborting before any elements are created.
  const contextSnapshot = { ...context };

  requestClipboard().then((text: any) => {
    if (!text || !text.startsWith(CLIP_PREFIX)) {
      return;
    }

    try {
      const json = text.substring(CLIP_PREFIX.length);
      const tree = JSON.parse(json, createReviver(moddle));
      copyPaste.paste({ ...contextSnapshot, tree });
    } catch (error) {
      console.error("Failed to deserialise clipboard content", error);
    }
  });

  return false;
});

// signal to VS Code that the webview is initialized
vsc_api.postMessage({ type: 'ready' });
