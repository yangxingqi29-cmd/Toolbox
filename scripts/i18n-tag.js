/* ==========================================================================
   scripts/i18n-tag.js — 给静态 HTML 批量打 i18n 标记

   跑： node scripts/i18n-tag.js          （正式写入）
        node scripts/i18n-tag.js --dry    （只报告，不写文件）

   它做四件事：
     1. 把 <link rel="stylesheet"> 后面插一行 <script src=".../js/i18n.js">
     2. 面包屑 "/ Xxx" 拆成 <span>/</span> <span>Xxx</span>，好让 Xxx 单独成 key
     3. 给"只含文本"的元素加 data-i18n="英文原文"
     4. 给混合内容里的裸文本包一层 <span data-i18n="...">
     5. placeholder → data-i18n-ph，meta description → data-i18n-content

   key 就是去掉 HTML 实体后的英文原文，和 js/i18n.js 里的词典对齐。
   幂等：已经带 data-i18n 的地方会跳过，重复跑不会叠加。
   ========================================================================== */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DRY  = process.argv.indexOf('--dry') >= 0;

/* ------------------------------ 工具函数 ------------------------------ */

const ENT = {
  nbsp:'\u00a0', middot:'·', copy:'©', hellip:'…', mdash:'—', ndash:'–',
  times:'×', divide:'÷', rarr:'→', larr:'←', harr:'↔', deg:'°',
  amp:'&', lt:'<', gt:'>', quot:'"', apos:"'", laquo:'«', raquo:'»',
  trade:'™', reg:'®', bull:'•', prime:'′', Prime:'″', sup2:'²', sup3:'³'
};

function decodeEnt(s){
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (m,h) => String.fromCharCode(parseInt(h,16)))
    .replace(/&#(\d+);/g,         (m,d) => String.fromCharCode(+d))
    .replace(/&([a-zA-Z][a-zA-Z0-9]*);/g, (m,n) =>
      Object.prototype.hasOwnProperty.call(ENT, n) ? ENT[n] : m);
}

function escAttr(s){
  return s.replace(/&/g,'&amp;').replace(/"/g,'&quot;')
          .replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

const hasLetters = s => /[A-Za-z]/.test(s);

// 网址、邮箱、裸域名不翻译（品牌名照抄）
const isOpaque = s =>
  /^(https?:\/\/|mailto:|[\w.+-]+@[\w.-]+\.[a-z]{2,}$|[\w-]+\.(com|org|net|io|dev|info|edu|gov)\b)/i.test(s);

const translatable = s => hasLetters(s) && !isOpaque(s);

/* ------------------------------ 主流程 ------------------------------ */

const files = ['index.html', 'privacy.html'].concat(
  fs.readdirSync(path.join(ROOT,'tools'))
    .filter(f => f.endsWith('.html'))
    .sort()
    .map(f => 'tools/' + f)
);

const keys = new Set();
const report = [];

for (const rel of files){
  const file = path.join(ROOT, rel);
  let src = fs.readFileSync(file, 'utf8');
  const before = src;
  let tagged = 0, wrapped = 0;

  /* ---- 0. 已有 i18n.js 就跳过注入 ---- */
  const base = rel.indexOf('tools/') === 0 ? '../' : '';
  if (src.indexOf('js/i18n.js') < 0){
    const linkRe = new RegExp('(<link rel="stylesheet" href="' +
      base.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + 'css/style\\.css">)');
    if (linkRe.test(src)){
      src = src.replace(linkRe, '$1\n<script src="' + base + 'js/i18n.js"></script>');
    } else {
      report.push('  !! ' + rel + ' 找不到 <link rel="stylesheet">，未注入 i18n.js');
    }
  }

  /* ---- 1. 面包屑："/ Xxx" 拆成独立 span ---- */
  src = src.replace(
    /(<div class="breadcrumb">[\s\S]*?<\/a>) \/ ([^<]+)<\/div>/g,
    '$1 <span>/</span> <span>$2</span></div>'
  );

  /* ---- 2. placeholder / meta description ---- */
  src = src.replace(/placeholder="([^"]*)"/g, (m, val) => {
    if (src.indexOf('data-i18n-ph="' + val + '"') >= 0) return m;
    const key = decodeEnt(val).replace(/\s+/g,' ').trim();
    if (!translatable(key)) return m;
    keys.add(key);
    return m + ' data-i18n-ph="' + escAttr(key) + '"';
  });
  src = src.replace(
    /(<meta name="description" content=")([^"]*)(")/g,
    (m, a, val, c) => {
      const key = decodeEnt(val).replace(/\s+/g,' ').trim();
      if (!translatable(key)) return m;
      keys.add(key);
      return a + val + c + ' data-i18n-content="' + escAttr(key) + '"';
    }
  );

  /* ---- 3. 保护区 ----
     · 品牌 logo（Tool<span>box</span>）—— 里面的 "Tool"/"box" 是拆开做样式的
     · <textarea> —— 它的内容是默认值，包 <span> 进去会变成字面文本，必须整块不动 */
  const held = [];
  const hold = m => { held.push(m); return '\u0001' + (held.length - 1) + '\u0001'; };
  src = src.replace(/<a class="brand"[\s\S]*?<\/a>/g, hold);
  src = src.replace(/<textarea[\s\S]*?<\/textarea>/g, hold);

  /* ---- 4. 纯文本元素：<tag attrs>文本</tag> ---- */
  const SKIP = /^(script|style|textarea)$/i;

  src = src.replace(
    /<([a-zA-Z][\w-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>([^<]+)<\/\1>/g,
    (m, tag, attrs, text) => {
      if (SKIP.test(tag)) return m;
      if (/\bdata-i18n/.test(attrs)) return m;
      const key = decodeEnt(text).replace(/\s+/g,' ').trim();
      if (!translatable(key)) return m;
      keys.add(key);
      tagged++;
      const out = '<' + tag + attrs + ' data-i18n="' + escAttr(key) + '">' + text + '</' + tag + '>';
      held.push(out);
      return '\u0001' + (held.length - 1) + '\u0001';
    }
  );

  /* ---- 5. 混合内容里的裸文本：包一层 span ---- */
  src = src.replace(/>([^<]+)</g, (m, text) => {
    const parts = text.split(/(\u0001\d+\u0001)/);
    const out = parts.map(seg => {
      if (/^\u0001\d+\u0001$/.test(seg)) return seg;
      const key = decodeEnt(seg).replace(/\s+/g,' ').trim();
      if (!translatable(key)) return seg;
      const lead = (seg.match(/^\s*/) || [''])[0];
      const tail = (seg.match(/\s*$/) || [''])[0];
      const core = seg.slice(lead.length, seg.length - tail.length);
      if (!core) return seg;
      keys.add(key);
      wrapped++;
      return lead + '<span data-i18n="' + escAttr(key) + '">' + core + '</span>' + tail;
    }).join('');
    return '>' + out + '<';
  });

  /* ---- 6. 还原占位符 ---- */
  src = src.replace(/\u0001(\d+)\u0001/g, (m, i) => held[+i]);

  report.push('  ' + rel.padEnd(32) + ' 元素 ' + String(tagged).padStart(3) +
              ' · 内联 ' + String(wrapped).padStart(2));

  if (!DRY && src !== before) fs.writeFileSync(file, src);
}

console.log(report.join('\n'));
console.log('\n唯一 key 共 ' + keys.size + ' 条' + (DRY ? '（dry run，未写入）' : ''));
