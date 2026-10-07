/* ==========================================================================
   date-calculator.js — 日期计算器
   三个功能：两日期相差、日期加减、年龄计算。
   ========================================================================== */

// ---- 两日期相差（按日历天，忽略时分秒）----
function daysBetween(a, b){
  const d1 = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const d2 = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((d2 - d1) / 86400000);
}

// ---- 相差的 年/月/日 拆解 ----
function diffYMD(from, to){
  let start = new Date(from), end = new Date(to);
  if (end < start){ const t = start; start = end; end = t; }
  let y = end.getFullYear() - start.getFullYear();
  let m = end.getMonth() - start.getMonth();
  let d = end.getDate() - start.getDate();
  if (d < 0){
    m--;
    const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0).getDate();
    d += prevMonth;
  }
  if (m < 0){ y--; m += 12; }
  return { y, m, d };
}

// ---- 日期加减 ----
function addToDate(base, years, months, days){
  const d = new Date(base);
  d.setFullYear(d.getFullYear() + (years||0));
  d.setMonth(d.getMonth() + (months||0));
  d.setDate(d.getDate() + (days||0));
  return d;
}

// ---- 是否闰年 / 当月天数 ----
function isLeap(y){ return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; }
function daysInMonth(y, m){ return [31, isLeap(y)?29:28,31,30,31,30,31,31,30,31,30,31][m]; }

// ---- 页面绑定 ----
(function init(){
  const $a = document.getElementById('dateA');
  const $b = document.getElementById('dateB');
  const $diff = document.getElementById('diff');
  const $base = document.getElementById('baseDate');
  const $y = document.getElementById('addY');
  const $m = document.getElementById('addM');
  const $d = document.getElementById('addD');
  const $addOut = document.getElementById('addOut');
  const $ageBirth = document.getElementById('birthDate');
  const $ageOut = document.getElementById('ageOut');
  if (!$diff) return;

  const kv = (label, value) =>
    `<div class="kv"><span>${t(label)}</span><span>${value}</span></div>`;
  const num = n => Number(n).toLocaleString(i18nLocale());
  const empty = key => '<span class="muted">' + t(key) + '</span>';
  const iso = d => d.getFullYear() + '-' +
                   String(d.getMonth() + 1).padStart(2,'0') + '-' +
                   String(d.getDate()).padStart(2,'0');

  // 星期名交给 Intl，各语言的大小写和拼写自动正确
  function weekdayName(d){
    try { return new Intl.DateTimeFormat(i18nLocale(), { weekday: 'long' }).format(d); }
    catch(e){ return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getDay()]; }
  }

  function renderDiff(){
    if (!$a.value || !$b.value){ $diff.innerHTML = empty('Pick two dates'); return; }
    const A = new Date($a.value + 'T00:00:00');
    const B = new Date($b.value + 'T00:00:00');
    const total = Math.abs(daysBetween(A, B));
    const ymd = diffYMD(A, B);
    const weeks = Math.floor(total / 7);
    const hours = total * 24;
    const minutes = hours * 60;
    $diff.innerHTML =
      kv('Total days', num(total)) +
      kv('Weeks + days', t('{w} weeks {d} days', { w: num(weeks), d: num(total % 7) })) +
      kv('Years / Months / Days', t('{y} y {m} m {d} d', { y: ymd.y, m: ymd.m, d: ymd.d })) +
      kv('Hours', num(hours)) +
      kv('Minutes', num(minutes));
  }

  function renderAdd(){
    if (!$base.value){ $addOut.innerHTML = empty('Pick a start date'); return; }
    const base = new Date($base.value + 'T00:00:00');
    const res = addToDate(base, parseInt($y.value||0,10), parseInt($m.value||0,10), parseInt($d.value||0,10));
    $addOut.innerHTML =
      kv('Result date', iso(res)) +
      kv('Weekday', weekdayName(res)) +
      kv('Leap year', t(isLeap(res.getFullYear()) ? 'Yes' : 'No'));
  }

  function renderAge(){
    if (!$ageBirth.value){ $ageOut.innerHTML = empty('Pick a birth date'); return; }
    const b = new Date($ageBirth.value + 'T00:00:00');
    const now = new Date();
    const ymd = diffYMD(b, now);
    const days = Math.abs(daysBetween(b, now));
    $ageOut.innerHTML =
      kv('Age', t('{y} years {m} months {d} days', { y: ymd.y, m: ymd.m, d: ymd.d })) +
      kv('Days lived', num(days)) +
      kv('Next birthday in', t('{d} days', { d: num(nextBirthday(b)) }));
  }

  function nextBirthday(b){
    const now = new Date();
    let next = new Date(now.getFullYear(), b.getMonth(), b.getDate());
    if (next < new Date(now.getFullYear(), now.getMonth(), now.getDate()))
      next = new Date(now.getFullYear()+1, b.getMonth(), b.getDate());
    return daysBetween(now, next);
  }

  ['input','change'].forEach(ev=>{
    $a.addEventListener(ev, renderDiff);
    $b.addEventListener(ev, renderDiff);
    $base.addEventListener(ev, renderAdd);
    [$y,$m,$d].forEach(el=>el.addEventListener(ev, renderAdd));
    $ageBirth.addEventListener(ev, renderAge);
  });

  // 默认值（iso() 定义在上面）
  const today = new Date();
  $a.value = iso(today);
  $b.value = iso(new Date(today.getTime() + 30*86400000));
  $base.value = iso(today);
  renderDiff(); renderAdd();
})();
