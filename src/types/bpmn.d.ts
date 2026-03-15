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

declare module "bpmn-js-native-copy-paste/lib/PasteUtil.js" {
    export function createReviver(moddle: any): (key: string, value: any) => any;
}