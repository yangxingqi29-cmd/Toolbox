/* ==========================================================================
   scripts/i18n-check.js — 词典完整性检查

   跑： node scripts/i18n-check.js

   1. 加载 js/i18n.js 的词典
   2. 扫所有 HTML 的 data-i18n / data-i18n-ph / data-i18n-content → 这些必须都有翻译
   3. 扫所有 js 里 t('...') 的字面量             → 这些必须都有翻译
   4. 顺便扫 js 里所有字符串字面量，命中词典的算「已使用」，
      用来找出词典里已经没人引用的死条目
   5. 有缺失就 exit 1

   注意：第 4 步只影响「未使用」报告，不影响缺失判定 —— 否则 id/class 名
   会混进来把结果冲爆。
   ========================================================================== */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const LANGS = ['zh', 'es', 'ru'];

const ENT = {
  nbsp:'\u00a0', middot:'·', copy:'©', hellip:'…', mdash:'—', ndash:'–',
  times:'×', divide:'÷', rarr:'→', larr:'←', harr:'↔', deg:'°',
  amp:'&', lt:'<', gt:'>', quot:'"', apos:"'", laquo:'«', raquo:'»'
};
const decodeEnt = s => s
  .replace(/&#x([0-9a-fA-F]+);/g, (m,h) => String.fromCharCode(parseInt(h,16)))
  .replace(/&#(\d+);/g,         (m,d) => String.fromCharCode(+d))
  .replace(/&([a-zA-Z][a-zA-Z0-9]*);/g, (m,n) =>
    Object.prototype.hasOwnProperty.call(ENT, n) ? ENT[n] : m);

/* ---------------------------------------------------------------- 词典 */
const src = fs.readFileSync(path.join(ROOT, 'js', 'i18n.js'), 'utf8');
const noop = () => {};
const fakeDoc = {
  documentElement: { lang:'', setAttribute:noop, removeAttribute:noop, getAttribute:()=>null },
  readyState: 'complete', title: '',
  querySelectorAll: () => [], addEventListener: noop, dispatchEvent: noop
};
const { I18N } = new Function(
  'document','location','navigator','localStorage','history','CustomEvent','setTimeout','Intl',
  '"use strict";' + src + '\n; return { I18N: I18N };'
)(
  fakeDoc, { search:'', href:'http://x/' }, { language:'en', languages:['en'] },
  { getItem:()=>null, setItem:noop }, { replaceState:noop }, function(){}, noop, Intl
);

const dictKeys = new Set();
for (const l of LANGS) for (const k of Object.keys(I18N[l] || {})) if (k !== 'units') dictKeys.add(k);

// 源码里的 '\n' 是两字符，运行时是一个换行符；比对前要先还原转义
const unesc = s => s.replace(/\\(u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|.)/g, (m, e) => {
  switch (e[0]){
    case 'n':  return '\n';
    case 't':  return '\t';
    case 'r':  return '\r';
    case 'b':  return '\b';
    case 'f':  return '\f';
    case 'v':  return '\v';
    case '0':  return '\0';
    case '\\': return '\\';
    case "'":  return "'";
    case '"':  return '"';
    case 'u':
    case 'x':  return String.fromCharCode(parseInt(e.slice(1), 16));
    default:   return m;
  }
});

/* --------------------------------------------------- 必须翻译的 key */
const required = new Map();   // key -> [来源]

function need(key, from){
  if (!key) return;
  if (!required.has(key)) required.set(key, []);
  if (required.get(key).indexOf(from) < 0) required.get(key).push(from);
}

/* ---- HTML ---- */
const htmlFiles = ['index.html', 'privacy.html'].concat(
  fs.readdirSync(path.join(ROOT, 'tools')).filter(f => f.endsWith('.html')).map(f => 'tools/' + f));

for (const rel of htmlFiles){
  const s = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  for (const m of s.matchAll(/data-i18n(?:-ph|-content|-title)?="([^"]*)"/g))
    need(decodeEnt(m[1]), rel);
}

/* ---- JS：t('...') 字面量 ---- */
const jsFiles = fs.readdirSync(path.join(ROOT, 'js')).filter(f => f.endsWith('.js') && f !== 'i18n.js');
const jsLiterals = new Set();

for (const f of jsFiles){
  const s = fs.readFileSync(path.join(ROOT, 'js', f), 'utf8');
  for (const m of s.matchAll(/\bt\(\s*'((?:[^'\\]|\\.)*)'/g))  need(unesc(m[1]), 'js/' + f);
  for (const m of s.matchAll(/\bt\(\s*"((?:[^"\\]|\\.)*)"/g))  need(unesc(m[1]), 'js/' + f);
  for (const m of s.matchAll(/'((?:[^'\\\n]|\\.)+)'/g))        jsLiterals.add(unesc(m[1]));
  for (const m of s.matchAll(/"((?:[^"\\\n]|\\.)+)"/g))        jsLiterals.add(unesc(m[1]));
}

/* ------------------------------------------------------------- 比对 */
const rows = [];
for (const [key, from] of required){
  const gaps = LANGS.filter(l => (I18N[l] || {})[key] === undefined);
  if (gaps.length) rows.push('  [' + gaps.join(',') + ']  ' + JSON.stringify(key) + '   ← ' + from.join(', '));
}

const unused = [...dictKeys].filter(k => !required.has(k) && !jsLiterals.has(k));

console.log('必须翻译的 key：' + required.size + ' 条');
console.log('词典条目：' + dictKeys.size + ' 条');
console.log('缺失翻译：' + rows.length + ' 条');

if (rows.length){
  console.log('\n--- 缺翻译明细 ---');
  console.log(rows.join('\n'));
}
if (unused.length){
  console.log('\n--- 词典里没人引用的条目（' + unused.length + '）---');
  console.log('  ' + unused.join('\n  '));
}

process.exit(rows.length ? 1 : 0);
