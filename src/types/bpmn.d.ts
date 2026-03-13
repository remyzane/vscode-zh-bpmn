// Global types for bpmn-js and related libraries

declare module 'bpmn-js/lib/Modeler' {
    const BpmnModeler: any;
    export default BpmnModeler;
}

declare module 'bpmn-js-color-picker' {
    const BpmnColorPickerModule: any;
    export default BpmnColorPickerModule;
}

declare module '*.css' {
    const content: any;
    export default content;
}

declare function acquireVsCodeApi(): any;

declare module 'bpmn-js-native-copy-paste' {
    // 添加模块的类型定义，如果模块没有明确的接口可以简化为:
    const module: any;
    export default module;
}
