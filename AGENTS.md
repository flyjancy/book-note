# 读书笔记整理 → PDF 工作流

## 收到新 markdown 文件时

1. **过滤行**：读取 markdown 内容，移除所有包含 `[在书中查看]` 的行
2. **生成 PDF**：运行 `node convert_to_pdf.js`（使用 `marked` + `puppeteer-core`，无头 Chrome 渲染）
   - 输出 A4 格式 PDF
   - `displayHeaderFooter: false`，无水印、无页眉页脚
   - 字体：Microsoft YaHei / SimSun
3. **验证**：确认 `.pdf` 文件已生成且有大小

## 说明

- `convert_to_pdf.js` 会自动扫描目录下所有 `.md` 文件
- 过滤逻辑已内置于 `convert_to_pdf.js` 中：`.filter(line => !line.includes('[在书中查看]'))`
- PDF 与 markdown 文件同名（扩展名不同）
