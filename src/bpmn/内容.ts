import BpmnColorPickerModule from 'bpmn-js-color-picker';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import ElementFactory from 'bpmn-js/lib/features/modeling/ElementFactory';
import 中文翻译 from '../i18n';


function 设置宽度高度(element: any, 设为: (width: number, height: number) => void) {
    if (element.type.endsWith('Task') || element.type === 'bpmn:CallActivity') {
        return 设为(85, 73);
    }
    if (element.type.endsWith('SubProcess')) {
        if (!element.di.isExpanded) {
            return 设为(85, 73); // 只限可展开的子流程
        }
    }
    // console.log('无需设置宽度和高度的 element：', element);
}

class CustomElementFactory extends ElementFactory {
    create(type: string, attrs: Record<string, any> = {}): any {
        let element: any;
        // 根据 type 字符串，显式调用对应重载
        if (type === 'shape') {
            element = super.create('shape', attrs);
        } else if (type === 'connection') {
            element = super.create('connection', attrs);
        } else if (type === 'label') {
            element = super.create('label', attrs);
        } else if (type === 'root') {
            element = super.create('root', attrs);
        } else {
            // fallback（理论上不会发生）
            element = super.create(type as any, attrs);
        }
        // 修改尺寸（仅对 shape）
        if (type === 'shape' && !attrs.width && !attrs.height) {
            设置宽度高度(element, (width: number, height: number) => {
                element.width = width;
                element.height = height;
            });
        }
        return element;
    }
}

// 新增一个模块，用于监听元素变更并修正尺寸
class ElementResizer {
    static $inject = ['eventBus', 'modeling'];

    constructor(private eventBus: any, private modeling: any) {
        this.eventBus.on('element.changed', (event: any) => {
            const { element } = event;
            if (!element.width || !element.height) { return; }
            设置宽度高度(element, (width: number, height: number) => {
                if (element.width !== width || element.height !== height) {
                    // 使用 modeling.resizeShape 安全地调整尺寸（会触发布局更新）
                    this.modeling.resizeShape(element, {
                        x: element.x,
                        y: element.y,
                        width,
                        height
                    });
                }
            });
        });
    }
}

// 定义翻译模块
export const 中文翻译模块 = {
    translate: ['value', 中文翻译]
};

// 配置完整的模型器选项，包括所有必要的模块
const modelerOptions: any = {
    container: '#canvas',
    textRenderer: {
        defaultStyle: {
            fontSize: 14,
        },
    },
    additionalModules: [
        BpmnColorPickerModule,
        中文翻译模块,
        {
            __init__: ['elementFactory'],
            elementFactory: ['type', CustomElementFactory]
        },
        {
            __init__: ['elementResizer'],
            elementResizer: ['type', ElementResizer]
        },
    ],
    // 启用控制面板，包含缩放功能
    keyboard: {
        bindTo: document
    }
};

export const modeler = new BpmnModeler(modelerOptions);

// 添加缩放工具栏到画布
setTimeout(() => {
    const canvas: any = modeler.get('canvas');
    const eventBus: any = modeler.get('eventBus');

    // 创建缩放控件容器
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'io-zoom-controls';
    controlsContainer.style.position = 'absolute';
    controlsContainer.style.bottom = '20px';
    controlsContainer.style.right = '20px';
    controlsContainer.style.zIndex = '100';

    // 创建按钮列表
    const buttonList = document.createElement('ul');
    buttonList.className = 'io-zoom-reset io-control io-control-list';
    buttonList.style.listStyle = 'none';
    buttonList.style.margin = '0';
    buttonList.style.padding = '0';
    buttonList.style.display = 'flex';
    buttonList.style.flexDirection = 'column';
    buttonList.style.backgroundColor = 'white';
    buttonList.style.borderRadius = '2px';
    buttonList.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
    buttonList.style.overflow = 'hidden';

    // 重置缩放按钮
    const resetZoomBtn = document.createElement('li');
    const resetButton = document.createElement('button');
    resetButton.title = '重置缩放';
    resetButton.innerHTML = '<span class="icon-size-reset">1:1</span>';
    resetButton.style.width = '30px';
    resetButton.style.height = '30px';
    resetButton.style.border = 'none';
    resetButton.style.background = 'transparent';
    resetButton.style.cursor = 'pointer';
    resetButton.style.display = 'flex';
    resetButton.style.alignItems = 'center';
    resetButton.style.justifyContent = 'center';
    resetButton.onclick = () => {
        canvas.zoom('fit-viewport');
    };
    resetZoomBtn.appendChild(resetButton);

    // 分隔线
    const separator1 = document.createElement('li');
    separator1.innerHTML = '<hr style="margin: 0; border: none; height: 1px; background-color: #eee;">';

    // 放大按钮
    const zoomInBtn = document.createElement('li');
    const zoomInButton = document.createElement('button');
    zoomInButton.title = '放大';
    zoomInButton.innerHTML = '<span class="icon-plus">+</span>';
    zoomInButton.style.width = '30px';
    zoomInButton.style.height = '30px';
    zoomInButton.style.border = 'none';
    zoomInButton.style.background = 'transparent';
    zoomInButton.style.cursor = 'pointer';
    zoomInButton.style.display = 'flex';
    zoomInButton.style.alignItems = 'center';
    zoomInButton.style.justifyContent = 'center';
    zoomInButton.style.fontSize = '16px';
    zoomInButton.onclick = () => {
        const currentViewbox = canvas.viewbox();
        const newScale = Math.min(3, currentViewbox.scale + 0.1);
        canvas.zoom(newScale);
    };
    zoomInBtn.appendChild(zoomInButton);

    // 分隔线
    const separator2 = document.createElement('li');
    separator2.innerHTML = '<hr style="margin: 0; border: none; height: 1px; background-color: #eee;">';

    // 缩小按钮
    const zoomOutBtn = document.createElement('li');
    const zoomOutButton = document.createElement('button');
    zoomOutButton.title = '缩小';
    zoomOutButton.innerHTML = '<span class="icon-minus">-</span>';
    zoomOutButton.style.width = '30px';
    zoomOutButton.style.height = '30px';
    zoomOutButton.style.border = 'none';
    zoomOutButton.style.background = 'transparent';
    zoomOutButton.style.cursor = 'pointer';
    zoomOutButton.style.display = 'flex';
    zoomOutButton.style.alignItems = 'center';
    zoomOutButton.style.justifyContent = 'center';
    zoomOutButton.style.fontSize = '16px';
    zoomOutButton.onclick = () => {
        const currentViewbox = canvas.viewbox();
        const newScale = Math.max(0.2, currentViewbox.scale - 0.1);
        canvas.zoom(newScale);
    };
    zoomOutBtn.appendChild(zoomOutButton);

    buttonList.appendChild(zoomOutBtn);
    buttonList.appendChild(separator2);
    buttonList.appendChild(zoomInBtn);
    buttonList.appendChild(separator1);
    buttonList.appendChild(resetZoomBtn);

    controlsContainer.appendChild(buttonList);

    // 将控件添加到画布容器中
    const canvasContainer = document.getElementById('canvas');
    if (canvasContainer) {
        canvasContainer.appendChild(controlsContainer);
    }
}, 100);
