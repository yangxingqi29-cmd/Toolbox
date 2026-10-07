/* ==========================================================================
   case-converter.js — 大小写 / 命名风格转换
   支持：UPPER, lower, Title, Sentence, camelCase, PascalCase,
        snake_case, kebab-case, CONSTANT_CASE, dot.case
   ========================================================================== */

// ---- 把任意风格拆成词数组 ----
function splitWords(str){
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')          // camelCase → camel Case
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')        // HTTPServer → HTTP Server
    .replace(/[_\-.\/\\]+/g, ' ')                     // 分隔符 → 空格
    .replace(/[^\w\s']/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

const TRANSFORMS = {
  upper:       s => s.toUpperCase(),
  lower:       s => s.toLowerCase(),
  title:       s => splitWords(s).map(w => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(' '),
  sentence:    s => {
    const t = s.toLowerCase().replace(/(^\s*\w|[.!?。！？]\s*\w)/g, c => c.toUpperCase());
    return t;
  },
  camel:       s => splitWords(s).map((w,i) => i===0 ? w.toLowerCase() : w[0].toUpperCase()+w.slice(1).toLowerCase()).join(''),
  pascal:      s => splitWords(s).map(w => w[0].toUpperCase()+w.slice(1).toLowerCase()).join(''),
  snake:       s => splitWords(s).map(w => w.toLowerCase()).join('_'),
  kebab:       s => splitWords(s).map(w => w.toLowerCase()).join('-'),
  constant:    s => splitWords(s).map(w => w.toUpperCase()).join('_'),
  dot:         s => splitWords(s).map(w => w.toLowerCase()).join('.'),
  alternating: s => [...s].map((c,i) => i%2 ? c.toUpperCase() : c.toLowerCase()).join(''),
  inverse:     s => [...s].map(c => c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()).join('')
};

function convert(str, style){
  const fn = TRANSFORMS[style];
  return fn ? fn(str) : str;
}

// ---- 页面绑定 ----
(function init(){
  const $in = document.getElementById('input');
  const $grid = document.getElementById('results');
  const $clear = document.getElementById('clear');
  if (!$in) return;

  const STYLES = [
    ['upper','UPPERCASE'], ['lower','lowercase'], ['title','Title Case'],
    ['sentence','Sentence case'], ['camel','camelCase'], ['pascal','PascalCase'],
    ['snake','snake_case'], ['kebab','kebab-case'], ['constant','CONSTANT_CASE'],
    ['dot','dot.case'], ['alternating','aLtErNaTiNg'], ['inverse','iNVERSE cASE']
  ];

  function render(){
    const v = $in.value;
    $grid.innerHTML = STYLES.map(([key,label])=>{
      const out = convert(v, key);
      const esc = out.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      return `<div class="panel" style="padding:14px;margin:0">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span class="muted" style="font-size:12.5px">${label}</span>
          <button class="btn ghost sm" data-copy="${key}">Copy</button>
        </div>
        <div class="out" style="min-height:40px">${esc || '<span class="muted">—</span>'}</div>
      </div>`;
    }).join('');

    $grid.querySelectorAll('[data-copy]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        navigator.clipboard.writeText(convert($in.value, btn.dataset.copy)).then(()=>{
          btn.textContent='Copied!'; setTimeout(()=>btn.textContent='Copy',1000);
        });
      });
    });
  }

  $in.addEventListener('input', render);
  $clear.addEventListener('click', ()=>{ $in.value=''; render(); $in.focus(); });
  render();
})();
