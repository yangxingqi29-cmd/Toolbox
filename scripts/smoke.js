/* ==========================================================================
   scripts/smoke.js — 用 jsdom 真跑一遍每个页面，验证 i18n 落地

   跑： node scripts/smoke.js

   对每个页面 × 每种语言：
     · 用 jsdom 真加载 HTML、真执行 <script>
     · 断言没有未捕获的运行时错误
     · 断言 <html lang> 正确
     · 断言导航渲染出来了、语言下拉有 4 项
     · 统计 [data-i18n] 里"没被翻译"的元素（排除本来就该保持原样的缩写）

   需要 jsdom： npm install --no-save jsdom
   ========================================================================== */
const fs = require('fs');
const path = require('path');

let JSDOM, VirtualConsole, requestInterceptor;
try {
  ({ JSDOM, VirtualConsole, requestInterceptor } = require('jsdom'));
} catch (e) {
  console.log('没装 jsdom，跳过浏览器冒烟测试。');
  console.log('跑一次： npm install --no-save jsdom');
  process.exit(0);
}

const ROOT = path.join(__dirname, '..');
const LANGS = ['en', 'zh', 'es', 'ru'];

/* 这些 key 在各语言下本来就该长得一样（缩写、符号、技术名） */
const SAME_OK = new Set([
  'HEX', 'RGB', 'HSL', 'UTC', 'ISO 8601', 'RFC 2822', 'URL',
  'L — 7%', 'M — 15%', 'Q — 25%', 'H — 30%',
  'UPPERCASE', 'lowercase', 'camelCase', 'PascalCase',
  'snake_case', 'kebab-case', 'CONSTANT_CASE', 'dot.case',
  'aLtErNaTiNg', 'iNVERSE cASE', 'px', 'undefined',
  'g — global', 'u — unicode', 'y — sticky',   // regex 标志名，西语里也照写英文
  'URL-safe variant (', ', no padding )'
]);

/* 把 http://localhost/... 映射回本地文件；外部 CDN 一律 404（不影响这些页面的初始渲染） */
const MIME = { '.js':'text/javascript', '.css':'text/css', '.html':'text/html',
               '.png':'image/png', '.svg':'image/svg+xml' };

const localFiles = requestInterceptor(request => {
  const m = /^https?:\/\/localhost(\/[^?#]*)/.exec(request.url);
  if (!m) return new Response('', { status: 404 });
  const fp = path.join(ROOT, decodeURIComponent(m[1]));
  if (!fs.existsSync(fp) || !fs.statSync(fp).isFile()) return new Response('', { status: 404 });
  return new Response(fs.readFileSync(fp), {
    status: 200,
    headers: { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' }
  });
});

/* 这些是 jsdom 的环境限制，不是页面问题：
   · CDN 拿不到（本地离线跑，pdf-lib 加载不到，但只在点击时才用）
   · jsdom 没装 canvas 包，getContext() 不可用（真浏览器里没问题） */
const IGNORE = /jsdelivr|open\.er-api|Could not load|resource|css parsing|getContext|canvas npm package/i;

const pages = ['index.html', 'privacy.html'].concat(
  fs.readdirSync(path.join(ROOT, 'tools')).filter(f => f.endsWith('.html')).map(f => 'tools/' + f));

/* jsdom 里异步脚本抛错有时会直接冒到 Node，别让它把整轮测试打断 */
let currentErrors = null;
process.on('uncaughtException', e => {
  const m = (e && e.message ? e.message : String(e)).split('\n')[0];
  if (currentErrors) currentErrors.push('未捕获: ' + m);
  else console.log('  (后台未捕获错误) ' + m);
});
process.on('unhandledRejection', e => {
  const m = (e && e.message ? e.message : String(e)).split('\n')[0];
  if (currentErrors) currentErrors.push('未处理 Promise: ' + m);
});

function run(rel, lang){
  return new Promise(resolve => {
    const errors = [];
    currentErrors = errors;
    const vc = new VirtualConsole();
    const note = m => { if (!IGNORE.test(m)) errors.push(m.split('\n')[0].slice(0, 140)); };
    vc.on('jsdomError', e => note(e.message));
    vc.on('error', (...a) => note(String(a[0])));

    const url = 'http://localhost/' + rel + (lang === 'en' ? '' : '?lang=' + lang);

    JSDOM.fromFile(path.join(ROOT, rel), {
      url, runScripts: 'dangerously',
      resources: { interceptors: [localFiles] },
      pretendToBeVisual: true, virtualConsole: vc
    }).then(dom => {
      const done = () => {
        const d = dom.window.document;
        const out = { errors, lang: d.documentElement.lang, title: d.title };

        const nav = d.getElementById('nav');
        out.navHtml = nav ? nav.innerHTML.length : 0;
        out.langOptions = nav ? nav.querySelectorAll('[data-lang]').length : 0;

        const untranslated = [];
        let total = 0;
        d.querySelectorAll('[data-i18n]').forEach(el => {
          total++;
          const key = el.getAttribute('data-i18n');
          const got = el.textContent.trim();
          if (SAME_OK.has(key)) return;
          if (got === key.trim()) untranslated.push(key.slice(0, 60));
        });
        out.total = total;
        out.untranslated = untranslated;

        dom.window.close();
        resolve(out);
      };

      if (dom.window.document.readyState === 'complete') setTimeout(done, 30);
      else dom.window.addEventListener('load', () => setTimeout(done, 30));
    }).catch(e => resolve({ errors: ['加载失败: ' + e.message], fatal: true }));
  });
}

(async () => {
  let bad = 0;

  for (const lang of LANGS){
    console.log('\n=== ' + lang + ' ===');
    for (const rel of pages){
      const r = await run(rel, lang);
      if (r.fatal){
        console.log('  FATAL  ' + rel + '  ' + r.errors.join(' | '));
        bad++;
        continue;
      }

      const problems = [];
      if (r.errors.length) problems.push('运行时错误 ' + r.errors.length + ' 个: ' + r.errors.join(' | '));
      if (r.lang !== lang) problems.push('html lang = ' + r.lang);
      if (!r.navHtml) problems.push('导航没渲染');
      if (r.langOptions !== 4) problems.push('语言下拉 ' + r.langOptions + ' 项');
      if (lang !== 'en' && r.untranslated.length)
        problems.push('未翻译 ' + r.untranslated.length + '/' + r.total + ' 处: ' + r.untranslated.slice(0, 4).join(' / '));

      if (problems.length){
        console.log('  FAIL   ' + rel.padEnd(30) + '  ' + problems.join('  ·  '));
        bad++;
      } else {
        console.log('  ok     ' + rel.padEnd(30) + '  ' + r.total + ' 处文案已本地化');
      }
    }
  }

  console.log('\n' + (bad ? bad + ' 个页面有问题' : '全部页面通过冒烟测试 ✓'));
  process.exit(bad ? 1 : 0);
})();
