import BpmnColorPickerModule from 'bpmn-js-color-picker';
import NativeCopyPasteModule from 'bpmn-js-native-copy-paste';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import 中文翻译 from '../i18n';

// 定义翻译模块
export const 中文翻译模块 = {
    translate: ['value', 中文翻译]
};

// 配置完整的模型器选项，包括所有必要的模块
const modelerOptions: any = {
    container: '#canvas',
    additionalModules: [
        BpmnColorPickerModule,
        中文翻译模块,
        NativeCopyPasteModule,
    ],
};

export const modeler = new BpmnModeler(modelerOptions);

// 添加缩放工具栏到画布
setTimeout(() => {
    const canvas: any = modeler.get('canvas');
    // 创建 DOM 元素
    function createElm(className: string, tagName: string = 'div') {
        const elm = document.createElement(tagName);
        elm.className = className;
        return elm;
    }
    // 创建缩放按钮
    function createZoomButton(innerHTML: string, onClickCallback: () => void) {
        const button = createElm('zh-zoom-btn', 'button');
        button.innerHTML = innerHTML;
        button.onclick = onClickCallback;
        return button;
    }
    // 创建按钮容器
    const buttonContainer = createElm('zh-zoom-container');
    // 缩小按钮
    buttonContainer.appendChild(createZoomButton(
        '<span class="zh-zoom-minus">-</span>',
        () => canvas.zoom(Math.max(0.2, canvas.viewbox().scale - 0.1))
    ));
    // 放大按钮
    buttonContainer.appendChild(createZoomButton(
        '<span class="zh-zoom-plus">+</span>',
        () => canvas.zoom(Math.min(3, canvas.viewbox().scale + 0.1))
    ));
    // 重置缩放按钮
    buttonContainer.appendChild(createZoomButton(
        '<span class="zh-zoom-reset">1:1</span>',
        () => canvas.zoom('fit-viewport')
    ));
    // 创建缩放控件容器
    const controlsContainer = createElm('zh-zoom-controls');
    controlsContainer.appendChild(buttonContainer);
    // 将控件添加到画布容器中
    const canvasContainer = document.getElementById('canvas');
    if (canvasContainer) {
        canvasContainer.appendChild(controlsContainer);
    }
}, 100);
