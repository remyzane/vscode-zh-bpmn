# 贡献指南

## Webview 的开发者工具
bpmn-js 事件内的 console 的输出，必须通过 Webview 开发者工具查看：
    按下快捷键： Ctrl/Cmd + Shift + P
    输入命令：Developer: Open Webview Developer Tools (开发人员: 打开 Webview 开发者工具)。

## 插件命令

### 初始化环境

```bash
# 准备代码
git clone https://github.com/remyzane/vscode-zh-completion.git

# 准备依赖库（bpmn-js）
cd ..
git clone https://github.com/remyzane/bpmn-js.git
cd bpmn-js
git checkout chinese

cd ../vscode-zh-bpmn

# 依赖库（../bpmn-js/bpmn-js.tgz）已添加到 package.json
# pnpm add file:../bpmn-js/bpmn-js.tgz
```

### 调试插件

调试： VSCode 命令栏 -> 开始调试 -> Run Extension

### 生成插件

```bash
# 安装打包环境（如果未安装）
npm install -g vsce

pnpm install

# 生成插件
vsce package --no-dependencies --baseImagesUrl https://gitee.com/remyzane/vscode-zh-bpmn/raw/main

# 发布插件
./publish.sh
```

## 提交规范

### 提交类型

- ✨ 功能：功能实现
- 🐛 修复：问题修复
- ⚡ 优化：性能与体验优化
- 🧹 整理：代码结构与格式清理
- 📦 依赖：依赖库更新
- 💥 重构：架构级重构
- 🧪 测试：测试代码与用例
- 📚 文档：文档与注释更新
- ⛵ 版本：发布版本
- 🌍 部署：环境部署与配置变更
- 🔧 杂项：其他琐碎事项
