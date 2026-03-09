import BpmnColorPickerModule from 'bpmn-js-color-picker';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import ElementFactory from 'bpmn-js/lib/features/modeling/ElementFactory';
import 中文翻译 from '../i18n';


function 设置宽度高度(element: any, 设为: (width: number, height: number) => void) {
    if (element.type.endsWith('Task') || element.type === 'bpmn:CallActivity') {
        return 设为(75, 70);
    }
    if (element.type.endsWith('SubProcess')) {
        if (!element.di.isExpanded) {
            return 设为(75, 70); // 只限可展开的子流程
        }
    }
    if (element.type.endsWith('Event')) {
        return 设为(32, 32);
    }
    if (element.type.endsWith('Gateway')) {
        return 设为(40, 40);
    }
    if (element.type === 'bpmn:DataObjectReference') {
        return 设为(24, 34);
    }
    if (element.type === 'bpmn:DataStoreReference') {
        return 设为(44, 36);
    }
    console.log('无需设置宽度和高度的 element：', element);
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
        }
    ]
};

export const modeler = new BpmnModeler(modelerOptions);

modeler.on('import.done', () => {
    const canvas = modeler.get('canvas');
    const rootElement = canvas.getRootElement();
    requestAnimationFrame(() => {
        // 先放大到 1.2 倍（默认以视口中心缩放）
        canvas.zoom(1.2);
        // 再将根元素（整个流程图）居中
        canvas.center(rootElement);
    });
});
