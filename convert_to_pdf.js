const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const puppeteer = require('puppeteer-core');

const folder = 'C:\\Users\\fengrui\\Desktop\\读书笔记整理';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const css = `
  @page { margin: 2cm 1.5cm; }
  body { font-family: 'Microsoft YaHei', 'SimSun', serif; font-size: 12pt; line-height: 1.8; color: #222; }
  h1 { font-size: 20pt; margin-top: 1.5em; margin-bottom: 0.5em; color: #111; border-bottom: 2px solid #333; padding-bottom: 0.2em; }
  h2 { font-size: 16pt; margin-top: 1.2em; margin-bottom: 0.4em; color: #222; }
  h3 { font-size: 14pt; margin-top: 1em; margin-bottom: 0.3em; color: #333; }
  blockquote { border-left: 4px solid #999; margin-left: 0; padding-left: 1em; color: #555; font-style: italic; }
  code { background: #f4f4f4; padding: 2px 5px; border-radius: 3px; font-size: 11pt; }
  pre { background: #f4f4f4; padding: 10px; border-radius: 4px; overflow-x: auto; }
  ul, ol { padding-left: 2em; }
  p { margin: 0.5em 0; }
`;

(async () => {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu']
  });

  const mdfiles = fs.readdirSync(folder).filter(f => {
    if (!f.endsWith('.md') || f === 'AGENTS.md') return false;
    const pdfPath = path.join(folder, f.replace('.md', '.pdf'));
    return !fs.existsSync(pdfPath);
  });

  for (const fname of mdfiles) {
    const fpath = path.join(folder, fname);
    let mdText = fs.readFileSync(fpath, 'utf-8');
    const linesBefore = mdText.split('\n').length;
    mdText = mdText.split('\n').filter(line => !line.includes('[在书中查看]')).join('\n');
    const linesAfter = mdText.split('\n').length;
    fs.writeFileSync(fpath, mdText, 'utf-8');
    console.log('已清理: ' + fname + ' (' + (linesBefore - linesAfter) + ' 行已移除)');
    const htmlBody = marked.parse(mdText);
    const htmlDoc = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${htmlBody}</body></html>`;

    const htmlPath = path.join(folder, fname.replace('.md', '.html'));
    fs.writeFileSync(htmlPath, htmlDoc, 'utf-8');

    const pdfPath = path.join(folder, fname.replace('.md', '.pdf'));

    const page = await browser.newPage();
    await page.goto('file:///' + htmlPath.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      margin: { top: '2cm', bottom: '2cm', left: '1.5cm', right: '1.5cm' },
      displayHeaderFooter: false,
      printBackground: true
    });
    await page.close();

    fs.unlinkSync(htmlPath);
    console.log('已生成: ' + path.basename(pdfPath));
  }

  await browser.close();
})();
