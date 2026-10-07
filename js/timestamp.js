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

// 相对时间只算出「数值 + 单位」，文案交给 Intl.RelativeTimeFormat。
// 这样中文的「3 天前」、西语的「hace 3 días」、俄语的「3 дня назад」全都自动正确，
// 也不用为俄语的 1 год / 2 года / 5 лет 写复数规则。
function relativeParts(d){
  const diff = Date.now() - d.getTime();
  const abs = Math.abs(diff);
  const u = [
    ['year',   31536000000],
    ['month',  2592000000],
    ['day',    86400000],
    ['hour',   3600000],
    ['minute', 60000],
    ['second', 1000]
  ];
  for (const [unit, ms] of u){
    if (abs >= ms) return { value: -Math.floor(diff / ms), unit };
  }
  return null;
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

  function relativeStr(d){
    const p = relativeParts(d);
    return p ? tRelative(p.value, p.unit) : t('just now');
  }

  function renderFromTs(){
    const r = parseTimestamp($ts.value);
    if (!r){ $out.innerHTML = '<span class="muted">' + t('Enter a valid number') + '</span>'; return; }
    const d = r.date;
    $out.innerHTML = `
      <div class="kv"><span>${t('Detected')}</span><span>${t(r.unit === 's' ? 'seconds' : 'milliseconds')}</span></div>
      <div class="kv"><span>${t('Local')}</span><span>${fmtLocal(d)}</span></div>
      <div class="kv"><span>${t('UTC')}</span><span>${fmtUTC(d)}</span></div>
      <div class="kv"><span>${t('ISO 8601')}</span><span>${fmtISO(d)}</span></div>
      <div class="kv"><span>${t('RFC 2822')}</span><span>${fmtRFC(d)}</span></div>
      <div class="kv"><span>${t('Relative')}</span><span>${relativeStr(d)}</span></div>`;
  }

  function renderToTs(){
    const v = $date.value;
    if (!v){ $tsOut.textContent = '—'; return; }
    const d = new Date(v);
    if (isNaN(d.getTime())){ $tsOut.textContent = t('Invalid date'); return; }
    const s = Math.floor(d.getTime() / 1000);
    const ms = d.getTime();
    $tsOut.innerHTML = `<div class="kv"><span>${t('Seconds')}</span><span>${s}</span></div>
                        <div class="kv"><span>${t('Milliseconds')}</span><span>${ms}</span></div>`;
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
