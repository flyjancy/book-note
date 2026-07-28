const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const puppeteer = require('puppeteer-core');

const folder = __dirname;
const excludedMarkdown = new Set(['agents.md', 'readme.md']);
const defaultChromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const css = `
  @page { margin: 2cm 1.5cm; }
  body {
    font-family: 'Microsoft YaHei', 'SimSun', 'PingFang SC', 'Hiragino Sans GB', sans-serif;
    font-size: 12pt;
    line-height: 1.8;
    color: #222;
  }
  h1 { font-size: 20pt; margin-top: 1.5em; margin-bottom: 0.5em; color: #111; border-bottom: 2px solid #333; padding-bottom: 0.2em; }
  h2 { font-size: 16pt; margin-top: 1.2em; margin-bottom: 0.4em; color: #222; break-after: avoid; }
  h3 { font-size: 14pt; margin-top: 1em; margin-bottom: 0.3em; color: #333; break-after: avoid; }
  blockquote { border-left: 4px solid #999; margin-left: 0; padding-left: 1em; color: #555; font-style: italic; }
  code { background: #f4f4f4; padding: 2px 5px; border-radius: 3px; font-size: 11pt; }
  pre { background: #f4f4f4; padding: 10px; border-radius: 4px; overflow-x: auto; }
  ul, ol { padding-left: 2em; }
  p { margin: 0.5em 0; }
`;

function parseArgs() {
  const args = process.argv.slice(2);
  const unknownArgs = args.filter(arg => arg !== '--force');

  if (unknownArgs.length > 0) {
    throw new Error(`未知参数: ${unknownArgs.join(', ')}。可用参数: --force`);
  }

  return { force: args.includes('--force') };
}

function findChrome() {
  const chromePath = process.env.CHROME_PATH || defaultChromePath;

  if (!fs.existsSync(chromePath)) {
    throw new Error(
      `未找到 Google Chrome: ${chromePath}\n` +
      '请安装 Google Chrome，或通过 CHROME_PATH 指定可执行文件。'
    );
  }

  return chromePath;
}

function getMarkdownFiles() {
  return fs.readdirSync(folder, { withFileTypes: true })
    .filter(entry => entry.isFile())
    .map(entry => entry.name)
    .filter(name => name.toLowerCase().endsWith('.md'))
    .filter(name => !excludedMarkdown.has(name.toLowerCase()))
    .sort((a, b) => a.localeCompare(b, 'zh-CN'));
}

function cleanMarkdown(filePath) {
  const original = fs.readFileSync(filePath, 'utf8');
  const lines = original.split(/\r?\n/);
  const cleanedLines = lines.filter(line => !line.includes('[在书中查看]'));

  while (cleanedLines.at(-1)?.trim() === '') cleanedLines.pop();

  if (/^_Generated at: .+_$/.test(cleanedLines.at(-1)?.trim() || '')) {
    cleanedLines.pop();
    while (cleanedLines.at(-1)?.trim() === '') cleanedLines.pop();
    if (cleanedLines.at(-1)?.trim() === '##') cleanedLines.pop();
    while (cleanedLines.at(-1)?.trim() === '') cleanedLines.pop();
  }

  cleanedLines.push('');
  const cleaned = cleanedLines.join('\n');
  const removedLines = lines.length - cleanedLines.length;

  if (cleaned !== original) {
    fs.writeFileSync(filePath, cleaned, 'utf8');
  }

  return { markdown: cleaned, removedLines };
}

function getPdfPath(markdownName) {
  return path.join(folder, `${path.parse(markdownName).name}.pdf`);
}

function needsPdfBuild(markdownPath, pdfPath, force) {
  if (force || !fs.existsSync(pdfPath)) return true;

  const markdownTime = fs.statSync(markdownPath).mtimeMs;
  const pdfTime = fs.statSync(pdfPath).mtimeMs;
  return markdownTime > pdfTime;
}

function createHtml(markdown) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <style>${css}</style>
</head>
<body>${marked.parse(markdown)}</body>
</html>`;
}

async function renderPdf(browser, item) {
  const page = await browser.newPage();

  try {
    await page.setJavaScriptEnabled(false);
    await page.setContent(createHtml(item.markdown), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);

    const pdf = await page.pdf({
      format: 'A4',
      margin: { top: '2cm', bottom: '2cm', left: '1.5cm', right: '1.5cm' },
      displayHeaderFooter: false,
      printBackground: true
    });

    if (pdf.length === 0) {
      throw new Error('Chrome 返回了空 PDF');
    }

    fs.writeFileSync(item.pdfPath, pdf);
  } finally {
    await page.close();
  }
}

async function main() {
  const { force } = parseArgs();
  const markdownFiles = getMarkdownFiles();
  const pending = [];

  for (const name of markdownFiles) {
    const markdownPath = path.join(folder, name);
    const pdfPath = getPdfPath(name);
    const { markdown, removedLines } = cleanMarkdown(markdownPath);

    if (removedLines > 0) {
      console.log(`已清理: ${name} (${removedLines} 行已移除)`);
    }

    if (needsPdfBuild(markdownPath, pdfPath, force)) {
      pending.push({ name, markdown, pdfPath });
    } else {
      console.log(`已跳过: ${name} (PDF 已是最新)`);
    }
  }

  if (pending.length === 0) {
    console.log('没有需要生成的 PDF。');
    return;
  }

  const browser = await puppeteer.launch({
    executablePath: findChrome(),
    headless: true
  });
  const failures = [];

  try {
    for (const item of pending) {
      try {
        await renderPdf(browser, item);
        console.log(`已生成: ${path.basename(item.pdfPath)}`);
      } catch (error) {
        failures.push({ name: item.name, error });
        console.error(`生成失败: ${item.name}\n${error.stack || error.message}`);
      }
    }
  } finally {
    await browser.close();
  }

  if (failures.length > 0) {
    process.exitCode = 1;
    console.error(`共 ${failures.length} 个文件生成失败。`);
  }
}

main().catch(error => {
  process.exitCode = 1;
  console.error(error.stack || error.message);
});
