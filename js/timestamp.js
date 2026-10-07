/* ==========================================================================
   timestamp.js — Unix 时间戳 ↔ 日期
   纯逻辑在上，页面绑定在下。
   ========================================================================== */

// ---- 解析时间戳：自动判断秒/毫秒 ----
function parseTimestamp(input){
  const s = String(input).trim();
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  let n = parseFloat(s);
  // 10 位左右是秒，13 位左右是毫秒
  const digits = s.replace(/[-.]/g,'').length;
  let ms;
  if (digits >= 12) ms = n;          // 毫秒
  else ms = n * 1000;                // 秒
  const d = new Date(ms);
  if (isNaN(d.getTime())) return null;
  return { ms, date:d, unit: digits >= 12 ? 'ms' : 's' };
}

// ---- 格式化 ----
function pad(n, w){ return String(n).padStart(w || 2, '0'); }

function fmtLocal(d){
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ` +
         `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
function fmtUTC(d){
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())} ` +
         `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`;
}
function fmtISO(d){ return d.toISOString(); }
function fmtRFC(d){ return d.toUTCString(); }

function relative(d){
  const diff = Date.now() - d.getTime();
  const abs = Math.abs(diff);
  const future = diff < 0;
  const u = [
    ['year',   31536000000],
    ['month',  2592000000],
    ['day',    86400000],
    ['hour',   3600000],
    ['minute', 60000],
    ['second', 1000]
  ];
  for (const [name, ms] of u){
    if (abs >= ms){
      const n = Math.floor(abs / ms);
      return (future ? 'in ' : '') + n + ' ' + name + (n>1?'s':'') + (future ? '' : ' ago');
    }
  }
  return 'just now';
}

// ---- 页面绑定 ----
(function init(){
  const $ts    = document.getElementById('ts');
  const $now   = document.getElementById('now');
  const $clear = document.getElementById('clear');
  const $out   = document.getElementById('out');
  const $date  = document.getElementById('date');
  const $toTs  = document.getElementById('toTs');
  const $tsOut = document.getElementById('tsOut');
  if (!$ts) return;

  function renderFromTs(){
    const r = parseTimestamp($ts.value);
    if (!r){ $out.innerHTML = '<span class="muted">Enter a valid number</span>'; return; }
    const d = r.date;
    $out.innerHTML = `
      <div class="kv"><span>Detected</span><span>${r.unit === 's' ? 'seconds' : 'milliseconds'}</span></div>
      <div class="kv"><span>Local</span><span>${fmtLocal(d)}</span></div>
      <div class="kv"><span>UTC</span><span>${fmtUTC(d)}</span></div>
      <div class="kv"><span>ISO 8601</span><span>${fmtISO(d)}</span></div>
      <div class="kv"><span>RFC 2822</span><span>${fmtRFC(d)}</span></div>
      <div class="kv"><span>Relative</span><span>${relative(d)}</span></div>`;
  }

  function renderToTs(){
    const v = $date.value;
    if (!v){ $tsOut.textContent = '—'; return; }
    const d = new Date(v);
    if (isNaN(d.getTime())){ $tsOut.textContent = 'Invalid date'; return; }
    const s = Math.floor(d.getTime() / 1000);
    const ms = d.getTime();
    $tsOut.innerHTML = `<div class="kv"><span>Seconds</span><span>${s}</span></div>
                        <div class="kv"><span>Milliseconds</span><span>${ms}</span></div>`;
  }

  $ts.addEventListener('input', renderFromTs);
  $date.addEventListener('input', renderToTs);
  $now.addEventListener('click', ()=>{ $ts.value = Math.floor(Date.now()/1000); renderFromTs(); });
  $clear.addEventListener('click', ()=>{ $ts.value=''; $out.innerHTML='<span class="muted">—</span>'; });

  // 默认填当前时间戳
  $ts.value = Math.floor(Date.now()/1000);
  renderFromTs();
  const nowLocal = new Date();
  nowLocal.setMinutes(nowLocal.getMinutes() - nowLocal.getTimezoneOffset());
  $date.value = nowLocal.toISOString().slice(0,16);
  renderToTs();
})();
