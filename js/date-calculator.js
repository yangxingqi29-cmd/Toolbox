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

  function renderDiff(){
    if (!$a.value || !$b.value){ $diff.innerHTML = '<span class="muted">Pick two dates</span>'; return; }
    const A = new Date($a.value + 'T00:00:00');
    const B = new Date($b.value + 'T00:00:00');
    const total = Math.abs(daysBetween(A, B));
    const ymd = diffYMD(A, B);
    const weeks = Math.floor(total / 7);
    const hours = total * 24;
    const minutes = hours * 60;
    $diff.innerHTML = `
      <div class="kv"><span>Total days</span><span>${total}</span></div>
      <div class="kv"><span>Weeks + days</span><span>${weeks} weeks ${total % 7} days</span></div>
      <div class="kv"><span>Years / Months / Days</span><span>${ymd.y} y ${ymd.m} m ${ymd.d} d</span></div>
      <div class="kv"><span>Hours</span><span>${hours}</span></div>
      <div class="kv"><span>Minutes</span><span>${minutes}</span></div>`;
  }

  function renderAdd(){
    if (!$base.value){ $addOut.innerHTML = '<span class="muted">Pick a start date</span>'; return; }
    const base = new Date($base.value + 'T00:00:00');
    const res = addToDate(base, parseInt($y.value||0,10), parseInt($m.value||0,10), parseInt($d.value||0,10));
    const dow = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][res.getDay()];
    $addOut.innerHTML = `
      <div class="kv"><span>Result date</span><span>${res.getFullYear()}-${String(res.getMonth()+1).padStart(2,'0')}-${String(res.getDate()).padStart(2,'0')}</span></div>
      <div class="kv"><span>Weekday</span><span>${dow}</span></div>
      <div class="kv"><span>Leap year</span><span>${isLeap(res.getFullYear()) ? 'Yes' : 'No'}</span></div>`;
  }

  function renderAge(){
    if (!$ageBirth.value){ $ageOut.innerHTML = '<span class="muted">Pick a birth date</span>'; return; }
    const b = new Date($ageBirth.value + 'T00:00:00');
    const now = new Date();
    const ymd = diffYMD(b, now);
    const days = Math.abs(daysBetween(b, now));
    $ageOut.innerHTML = `
      <div class="kv"><span>Age</span><span>${ymd.y} years ${ymd.m} months ${ymd.d} days</span></div>
      <div class="kv"><span>Days lived</span><span>${days.toLocaleString()}</span></div>
      <div class="kv"><span>Next birthday in</span><span>${nextBirthday(b)} days</span></div>`;
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

  // 默认值
  const today = new Date();
  const iso = d => d.toISOString().slice(0,10);
  $a.value = iso(today);
  $b.value = iso(new Date(today.getTime() + 30*86400000));
  $base.value = iso(today);
  renderDiff(); renderAdd();
})();
