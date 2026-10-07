/* ==========================================================================
   mortgage.js — 房贷 / 贷款计算器
   支持等额本息（amortizing）和等额本金（linear）。
   纯逻辑在上，页面绑定在下。
   ========================================================================== */

// ---- 等额本息：月供 ----
// P 本金, annualRate 年利率(%), years 年限
function monthlyPayment(P, annualRate, years){
  const n = years * 12;
  const r = annualRate / 100 / 12;
  if (r === 0) return P / n;
  const f = Math.pow(1 + r, n);
  return P * r * f / (f - 1);
}

// ---- 等额本息完整计划 ----
function amortize(P, annualRate, years){
  const n = years * 12;
  const r = annualRate / 100 / 12;
  const pay = monthlyPayment(P, annualRate, years);
  let balance = P;
  let totalInterest = 0;
  const schedule = [];
  for (let i = 1; i <= n; i++){
    const interest = balance * r;
    const principal = pay - interest;
    balance -= principal;
    totalInterest += interest;
    schedule.push({ month:i, payment:pay, principal, interest, balance: Math.max(balance,0) });
  }
  return { monthly: pay, totalPaid: pay*n, totalInterest, schedule };
}

// ---- 等额本金 ----
function amortizeLinear(P, annualRate, years){
  const n = years * 12;
  const r = annualRate / 100 / 12;
  const principalEach = P / n;
  let balance = P;
  let totalInterest = 0;
  const schedule = [];
  for (let i = 1; i <= n; i++){
    const interest = balance * r;
    const pay = principalEach + interest;
    balance -= principalEach;
    totalInterest += interest;
    schedule.push({ month:i, payment:pay, principal:principalEach, interest, balance: Math.max(balance,0) });
  }
  return {
    monthlyFirst: schedule[0].payment,
    monthlyLast:  schedule[n-1].payment,
    totalPaid: P + totalInterest,
    totalInterest,
    schedule
  };
}

function money(n){
  return n.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2});
}

// ---- 页面绑定 ----
(function init(){
  const $amount = document.getElementById('amount');
  const $rate = document.getElementById('rate');
  const $years = document.getElementById('years');
  const $type = document.getElementById('type');
  const $out = document.getElementById('result');
  const $sched = document.getElementById('schedule');
  const $toggle = document.getElementById('toggleSched');
  if (!$amount) return;

  let showSched = false;

  function run(){
    const P = parseFloat($amount.value) || 0;
    const rate = parseFloat($rate.value) || 0;
    const years = parseFloat($years.value) || 1;

    if (P <= 0){ $out.innerHTML = '<span class="muted">Enter a loan amount</span>'; return; }

    let res, html;
    if ($type.value === 'linear'){
      res = amortizeLinear(P, rate, years);
      html = `
        <div class="kv"><span>First payment</span><span>${money(res.monthlyFirst)}</span></div>
        <div class="kv"><span>Last payment</span><span>${money(res.monthlyLast)}</span></div>
        <div class="kv"><span>Total interest</span><span>${money(res.totalInterest)}</span></div>
        <div class="kv"><span>Total paid</span><span>${money(res.totalPaid)}</span></div>
        <div class="kv"><span>Interest / principal</span><span>${(res.totalInterest/P*100).toFixed(1)}%</span></div>`;
    } else {
      res = amortize(P, rate, years);
      html = `
        <div class="kv"><span>Monthly payment</span><span>${money(res.monthly)}</span></div>
        <div class="kv"><span>Total interest</span><span>${money(res.totalInterest)}</span></div>
        <div class="kv"><span>Total paid</span><span>${money(res.totalPaid)}</span></div>
        <div class="kv"><span>Interest / principal</span><span>${(res.totalInterest/P*100).toFixed(1)}%</span></div>
        <div class="kv"><span>Payments</span><span>${res.schedule.length} months</span></div>`;
    }
    $out.innerHTML = html;

    // 计划表（按年汇总）
    if (showSched){
      const byYear = {};
      res.schedule.forEach(row=>{
        const y = Math.ceil(row.month/12);
        if (!byYear[y]) byYear[y] = { principal:0, interest:0, balance:0 };
        byYear[y].principal += row.principal;
        byYear[y].interest  += row.interest;
        byYear[y].balance    = row.balance;
      });
      let rows = '<div class="kv" style="font-weight:600"><span>Year</span><span>Principal / Interest / Balance</span></div>';
      Object.entries(byYear).forEach(([y,v])=>{
        rows += `<div class="kv"><span>${y}</span><span>${money(v.principal)} / ${money(v.interest)} / ${money(v.balance)}</span></div>`;
      });
      $sched.innerHTML = rows;
      $sched.style.display = 'block';
    } else {
      $sched.style.display = 'none';
    }
  }

  ['input','change'].forEach(ev=>{
    [$amount,$rate,$years,$type].forEach(el => el.addEventListener(ev, run));
  });

  $toggle.addEventListener('click', ()=>{
    showSched = !showSched;
    $toggle.textContent = showSched ? 'Hide amortization' : 'Show amortization';
    run();
  });

  run();
})();
