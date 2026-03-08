import BpmnModeler from 'bpmn-js/lib/Modeler';
import ElementFactory from 'bpmn-js/lib/features/modeling/ElementFactory';
import BpmnColorPickerModule from 'bpmn-js-color-picker';
import 中文翻译 from '../i18n';


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
                bo?.$instanceOf('bpmn:Gateway')
            ) {
                element.width = 36;
                element.height = 36;
            }
        }

        return element;
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
