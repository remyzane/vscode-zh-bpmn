import 中文词典 from './zh.js';

function 中文翻译(原始文本: string, 变量字典: { [原始文本: string]: string }) {
    变量字典 = 变量字典 || {};

    const 中文文本 = 中文词典[原始文本] || 原始文本;

    // 变量赋值，如：「在 {element} 中没有父元素 {parent}」 + {element: 'xxx', parent: 'yyy'} ->「在 xxx 中没有父元素 yyy」
    return 中文文本.replace(/{([^}]+)}/g, function (_, 变量) {
        return 变量字典[变量] || '{' + 变量 + '}';
    });
}

export default 中文翻译;
