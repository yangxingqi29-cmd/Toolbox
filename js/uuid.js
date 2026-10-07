/* ==========================================================================
   uuid.js — UUID 生成
   v4 用 crypto.getRandomValues（不是 Math.random）。
   ========================================================================== */

function uuidV4(){
  if (crypto.randomUUID) return crypto.randomUUID();
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  b[6] = (b[6] & 0x0f) | 0x40;   // version 4
  b[8] = (b[8] & 0x3f) | 0x80;   // variant
  const h = [...b].map(x => x.toString(16).padStart(2,'0')).join('');
  return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
}

function formatUuid(u, opts){
  let s = u;
  if (opts.noDashes) s = s.replace(/-/g,'');
  if (opts.upper)    s = s.toUpperCase();
  if (opts.braces)   s = '{' + s + '}';
  if (opts.urn)      s = 'urn:uuid:' + u;
  return s;
}

// ---- 页面绑定 ----
(function init(){
  const $count = document.getElementById('count');
  const $gen = document.getElementById('generate');
  const $out = document.getElementById('output');
  const $copyAll = document.getElementById('copyAll');
  const $download = document.getElementById('download');
  const $upper = document.getElementById('upper');
  const $noDashes = document.getElementById('nodashes');
  const $braces = document.getElementById('braces');
  if (!$count) return;

  let last = [];

  function run(){
    const n = Math.min(Math.max(parseInt($count.value,10) || 1, 1), 1000);
    const opts = {
      upper: $upper.checked,
      noDashes: $noDashes.checked,
      braces: $braces.checked
    };
    last = Array.from({length:n}, () => formatUuid(uuidV4(), opts));
    $out.value = last.join('\n');
  }

  $gen.addEventListener('click', run);
  [$upper, $noDashes, $braces].forEach(el => el.addEventListener('change', run));

  $copyAll.addEventListener('click', ()=>{
    navigator.clipboard.writeText(last.join('\n')).then(()=>{
      $copyAll.textContent = t('Copied!');
      setTimeout(()=>$copyAll.textContent = t('Copy all'), 1200);
    });
  });

  $download.addEventListener('click', ()=>{
    const blob = new Blob([last.join('\n')], {type:'text/plain'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'uuids.txt';
    a.click();
    URL.revokeObjectURL(a.href);
  });

  run();
})();
