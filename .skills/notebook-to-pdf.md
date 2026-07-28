# 读书笔记 → PDF 转换技能

## 触发条件
用户放入新的 markdown 读书笔记文件时，要求处理。

## 工作流程

### 1. 确认新文件
扫描目录，找出没有对应 `.pdf` 的 `.md` 文件（排除 `AGENTS.md`）。

### 2. 运行转换脚本
直接执行 `node convert_to_pdf.js`，该脚本已内置：
- **清理 markdown 源文件**：移除每行中包含 `[在书中查看]` 的行，并将清理后的内容写回原 `.md` 文件
- **增量转换**：只处理没有对应 PDF 的 markdown 文件，已有 PDF 的文件自动跳过

### 3. 验证输出
确认：
- `.md` 源文件中不再包含 `[在书中查看]` 行
- `.pdf` 文件已生成且有文件大小

## 技术细节

| 项目 | 内容 |
|------|------|
| Markdown 解析 | `marked` 库 |
| PDF 渲染 | `puppeteer-core` + 本地 Chrome 无头模式 |
| 页面格式 | A4，上下边距 2cm，左右边距 1.5cm |
| 字体 | Microsoft YaHei / SimSun |
| 页眉页脚 | 无（`displayHeaderFooter: false`） |
| 水印 | 无 |

## 文件结构
```
读书笔记整理/
├── .skills/
│   └── notebook-to-pdf.md          ← 本技能文件
├── convert_to_pdf.js               ← 转换脚本
├── AGENTS.md                       ← 项目说明
├── package.json                    ← 依赖配置
├── *.md                            ← 读书笔记源文件
└── *.pdf                           ← 生成的 PDF
```
