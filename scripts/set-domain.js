#!/usr/bin/env node
/**
 * 把站点里的占位域名换成真实域名，并写入静态 canonical / hreflang。
 *
 * 为什么需要静态写：i18n.js 里的 installAlternates() 是运行时用 JS 插 link，
 * 爬虫在原始 HTML 里看不到 —— 而 hreflang 恰恰是给爬虫看的。所以必须在构建期写死。
 *
 * 用法：
 *   node scripts/set-domain.js https://toolbox-abc.pages.dev          # 真写
 *   node scripts/set-domain.js https://toolbox-abc.pages.dev --dry    # 只看改什么
 *
 * 幂等：重复跑同一个域名，结果一样；换域名再跑会整体改写。
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT  = path.join(__dirname, '..');
const LANGS = ['en', 'zh', 'es', 'ru'];
const DEFAULT_LANG = 'en';

const args = process.argv.slice(2);
const dry  = args.includes('--dry');
let domain = args.find(a => !a.startsWith('--'));

if (!domain) {
  console.error('用法: node scripts/set-domain.js https://your-domain.com [--dry]');
  process.exit(1);
}
domain = domain.replace(/\/+$/, '');                       // 去掉结尾斜杠
if (!/^https?:\/\//i.test(domain)) {
  console.error('域名要以 http:// 或 https:// 开头，例如 https://toolbox.pages.dev');
  process.exit(1);
}

/* ------------------------------------------------------------------ 收集页面 */

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git' || name.startsWith('.')) continue;
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (name.endsWith('.html')) out.push(full);
  }
  return out;
}

const pages = walk(ROOT).sort();

/** 文件路径 → 站点绝对路径。index.html 归一成 / */
function urlPath(file) {
  let rel = path.relative(ROOT, file).split(path.sep).join('/');
  rel = rel.replace(/index\.html$/, '');
  return '/' + rel;
}

function pageUrl(p, lang) {
  const base = domain + p;
  if (lang === DEFAULT_LANG) return base;
  return base + (base.includes('?') ? '&' : '?') + 'lang=' + lang;
}

/* ------------------------------------------------------------------ 生成 head 块 */

function seoBlock(p) {
  const lines = [];
  lines.push(`<link rel="canonical" href="${domain + p}">`);
  for (const lang of LANGS) {
    lines.push(`<link rel="alternate" hreflang="${lang}" href="${pageUrl(p, lang)}">`);
  }
  lines.push(`<link rel="alternate" hreflang="x-default" href="${domain + p}">`);
  return lines.join('\n');
}

// 匹配已有块（含缩进），用来先删后插，保证幂等
const OLD_BLOCK = /^[ \t]*<link rel="canonical"[^\n]*\n(?:[ \t]*<link rel="alternate"[^\n]*\n)*/gm;

/* ------------------------------------------------------------------ 处理 HTML */

let htmlChanged = 0;
const report = [];

for (const file of pages) {
  const p = urlPath(file);
  let src = fs.readFileSync(file, 'utf8');

  const before = src;
  src = src.replace(OLD_BLOCK, '');                       // 清掉旧块
  src = src.replace(/[ \t]*\n(?=[ \t]*<\/head>)/, '\n');  // 清掉可能留下的空行

  if (!src.includes('</head>')) {
    console.error(`跳过（没有 </head>）: ${path.relative(ROOT, file)}`);
    continue;
  }

  const block = seoBlock(p);
  src = src.replace('</head>', block + '\n</head>');

  if (src !== before) {
    htmlChanged++;
    report.push(`  ${path.relative(ROOT, file).split(path.sep).join('/')}  →  ${p}`);
    if (!dry) fs.writeFileSync(file, src);
  }
}

/* ------------------------------------------------------------------ 处理 sitemap / robots */

let txtChanged = 0;

function patchTextFile(name, fn) {
  const file = path.join(ROOT, name);
  if (!fs.existsSync(file)) { console.error(`跳过（不存在）: ${name}`); return; }
  const before = fs.readFileSync(file, 'utf8');
  const after = fn(before);
  if (after !== before) {
    txtChanged++;
    report.push(`  ${name}`);
    if (!dry) fs.writeFileSync(file, after);
  }
}

// <loc> 只换主机部分，路径和 priority 原样保留 —— 这样换域名重跑也不会累积错误。
// 顶部那句「把 example.com 换掉」的提示跑完就过期了，一并换成固定说明。
patchTextFile('sitemap.xml', s => s
  .replace(/<!--[\s\S]*?-->\s*/, '<!-- 由 scripts/set-domain.js 写入域名；改域名重跑该脚本即可 -->\n')
  .replace(/(<loc>)https?:\/\/[^/]+/g, `$1${domain}`));

patchTextFile('robots.txt', s =>
  s.replace(/^(Sitemap:\s*)https?:\/\/\S+/m, `$1${domain}/sitemap.xml`));

/* ------------------------------------------------------------------ 输出 */

console.log(`域名: ${domain}${dry ? '   [DRY RUN — 不写盘]' : ''}`);
console.log(`\n改动的文件 (${htmlChanged + txtChanged}):`);
console.log(report.join('\n'));
console.log(`\nHTML ${htmlChanged} 个页面，另加 ${txtChanged} 个文本文件。`);
if (dry) console.log('干跑模式，什么都没写。去掉 --dry 才会真正落盘。');
else     console.log('完成。建议接着跑 node scripts/smoke.js 确认页面没坏。');
