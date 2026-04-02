
echo "「BPMN 编辑器」插件打包、发布"
echo "=========================="

echo "请输入 VSCode 令牌（如果只打包不发布，则直接回车）："
read token

pnpm add "file:$(ls ../bpmn-js/bpmn-js-*.tgz | sort -V | tail -n1)"

if [ -z "$token" ]; then
  # 如果 token 为空，则只打包，不发布
  vsce package --no-dependencies --baseImagesUrl https://gitee.com/remyzane/vscode-zh-bpmn/raw/main
else
  # 如果 token 不为空，则打包 + 发布
  vsce publish --no-dependencies -p $token --baseImagesUrl https://gitee.com/remyzane/vscode-zh-bpmn/raw/main
fi
