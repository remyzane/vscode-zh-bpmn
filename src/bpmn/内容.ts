import BpmnColorPickerModule from 'bpmn-js-color-picker';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import ElementFactory from 'bpmn-js/lib/features/modeling/ElementFactory';
import 中文翻译 from '../i18n';


function 默认宽度高度(element: any) {
    const bo = element.businessObject;

    if (bo?.$instanceOf('bpmn:Task')) {
        element.width = 50;
        element.height = 40;
    } else if (
        bo?.$instanceOf('bpmn:Event')
    ) {
        element.width = 24;
        element.height = 24;
    } else if (
        bo?.$instanceOf('bpmn:Gateway') ||
        bo?.$instanceOf('bpmn:inclusiveGateway') ||
        bo?.$instanceOf('bpmn:exclusiveGateway')
    ) {
        element.width = 36;
        element.height = 36;
    }
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
            const bo = element.businessObject;

            if (bo?.$instanceOf('bpmn:Task')) {
                element.width = 50;
                element.height = 40;
            } else if (
                bo?.$instanceOf('bpmn:Event')
            ) {
                element.width = 24;
                element.height = 24;
            } else if (
                bo?.$instanceOf('bpmn:Gateway') ||
                bo?.$instanceOf('bpmn:inclusiveGateway') ||
                bo?.$instanceOf('bpmn:exclusiveGateway')
            ) {
                element.width = 36;
                element.height = 36;
            }
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
            const bo = element.businessObject;

            if (!bo || !element.width || !element.height) { return; }

            // 判断是否是需要特殊尺寸的 BPMN 类型
            let newWidth: number | undefined;
            let newHeight: number | undefined;

            if (bo.$instanceOf('bpmn:Task')) {
                newWidth = 50;
                newHeight = 40;
            } else if (bo.$instanceOf('bpmn:Event')) {
                newWidth = 24;
                newHeight = 24;
            } else if (
                bo.$instanceOf('bpmn:Gateway') ||
                bo.$instanceOf('bpmn:InclusiveGateway') ||
                bo.$instanceOf('bpmn:ExclusiveGateway') ||
                bo.$instanceOf('bpmn:ParallelGateway')
            ) {
                newWidth = 36;
                newHeight = 36;
            }

            // 如果当前尺寸不符合预期，就更新
            if (
                newWidth !== undefined &&
                (element.width !== newWidth || element.height !== newHeight)
            ) {
                // 使用 modeling.resizeShape 安全地调整尺寸（会触发布局更新）
                this.modeling.resizeShape(element, {
                    x: element.x,
                    y: element.y,
                    width: newWidth,
                    height: newHeight
                });
            }
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
    // 稍微延时执行，确保视图渲染完毕
    setTimeout(() => {
        canvas.zoom(1.3);
    }, 100);
});

// 在 modeler 初始化后（例如 import.done 或 createDiagram 后）
modeler.on('import.done', () => {
    const eventBus = modeler.get('eventBus');
    const modeling = modeler.get('modeling');
    eventBus.on('commandStack.changed', (e: any) => {
        console.log('Command executed', e);
    });
});
