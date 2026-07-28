# 读书摘录整理 -> PDF 工作流

## 首次运行

1. 安装 Node.js 和 Google Chrome。
2. 在本目录运行 `npm ci` 安装锁定版本的依赖。
   - 如果用户级 npm 缓存存在权限问题，改用 `npm ci --cache /private/tmp/book-note-npm-cache`，不要修改整个 `~/.npm` 的所有权。
3. 默认使用 `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`；如 Chrome 位于其他位置，通过 `CHROME_PATH` 指定可执行文件。

## 收到新 Markdown 文件时

1. **清理内容**：移除所有包含 `[在书中查看]` 的行，以及文件末尾的空标题和 `_Generated at: ..._` 导出元数据。
2. **生成 PDF**：运行 `node convert_to_pdf.js`（使用 `marked` + `puppeteer-core`，通过无头 Chrome 渲染）。
   - 输出 A4 格式 PDF。
   - `displayHeaderFooter: false`，无水印、无页眉页脚。
   - 字体优先使用 Microsoft YaHei / SimSun，并提供 macOS 中文字体回退。
3. **验证**：确认同名 `.pdf` 已生成且文件大小大于 0。
4. **询问评分**：向用户询问该书的个人评分，满分 10 分，允许一位小数。
   - 未取得用户评分前，不得猜测评分或写入占位分数。
5. **更新索引**：将书名、作者、简介、摘录重点、Markdown/PDF 链接和用户评分加入 `README.md`。
   - 按文件名中的阅读时间倒序排列，最新条目放在最前面。
   - 明确文件内容是个人摘录，不是完整书稿。

## 转换脚本说明

- `convert_to_pdf.js` 自动扫描脚本目录下的摘录 `.md` 文件，并排除 `README.md` 和 `AGENTS.md`。
- 每次运行都会先清理阅读链接和末尾导出元数据；仅当内容发生变化时才写回 Markdown。
- 默认只生成缺失或比 Markdown 更旧的 PDF；运行 `node convert_to_pdf.js --force` 可强制重建全部 PDF。
- PDF 与 Markdown 同名，仅扩展名不同。
