/* ==========================================================================
   currency.js — 汇率换算
   用免费无 key 的公开汇率接口（open.er-api.com），失败时回退静态汇率。
   汇率以 USD 为基准：rates[X] = 1 USD 等于多少 X。
   ========================================================================== */

const CURRENCIES = {
  USD:'US Dollar', EUR:'Euro', GBP:'British Pound', JPY:'Japanese Yen',
  CNY:'Chinese Yuan', HKD:'Hong Kong Dollar', AUD:'Australian Dollar',
  CAD:'Canadian Dollar', CHF:'Swiss Franc', NZD:'New Zealand Dollar',
  KRW:'South Korean Won', SGD:'Singapore Dollar', INR:'Indian Rupee',
  THB:'Thai Baht', MYR:'Malaysian Ringgit', IDR:'Indonesian Rupiah',
  PHP:'Philippine Peso', VND:'Vietnamese Dong', RUB:'Russian Ruble',
  BRL:'Brazilian Real', MXN:'Mexican Peso', ZAR:'South African Rand',
  TRY:'Turkish Lira', SEK:'Swedish Krona', NOK:'Norwegian Krone',
  DKK:'Danish Krone', PLN:'Polish Zloty', CZK:'Czech Koruna',
  AED:'UAE Dirham', SAR:'Saudi Riyal', ILS:'Israeli Shekel'
};

// 离线回退汇率（1 USD = ?），仅当网络失败时使用
const FALLBACK = {
  USD:1, EUR:0.92, GBP:0.79, JPY:157, CNY:7.25, HKD:7.81, AUD:1.52,
  CAD:1.37, CHF:0.89, NZD:1.66, KRW:1380, SGD:1.35, INR:83.5, THB:36.6,
  MYR:4.7, IDR:16200, PHP:58.5, VND:25400, RUB:88, BRL:5.4, MXN:17.2,
  ZAR:18.3, TRY:32.5, SEK:10.5, NOK:10.7, DKK:6.9, PLN:3.95, CZK:23.2,
  AED:3.67, SAR:3.75, ILS:3.7
};

let RATES = { ...FALLBACK };
let ratesAreLive = false;

// ---- 汇率获取 ----
async function loadRates(){
  try{
    const r = await fetch('https://open.er-api.com/v6/latest/USD');
    const j = await r.json();
    if (j && j.rates){
      RATES = j.rates;
      ratesAreLive = true;
      document.getElementById('rate').textContent =
        t('Live rates · updated {t}', { t: new Date().toLocaleTimeString(i18nLocale()) });
    }
  }catch(e){
    ratesAreLive = false;
    document.getElementById('rate').textContent = t('Offline — using built-in fallback rates');
  }
  // 注意：renderPopular() 定义在下面的 init() 里，属于局部作用域，
  // 从全局的 loadRates() 里根本调不到（会 ReferenceError）。
  // 所以这里只负责取汇率，渲染由 init() 在 then 里接着做。
}

// 100 单位 from → to
function convert(amount, from, to){
  const f = RATES[from];   // 1 USD = f from
  const t = RATES[to];     // 1 USD = t to
  if (!f || !t) return NaN;
  return amount / f * t;   // amount(from) → USD → to
}

function fmt(n){
  if (!isFinite(n)) return '—';
  // 用当前语言的数字格式（俄语/西语的小数分隔符和分组方式与英文不同）
  return n.toLocaleString(i18nLocale(),{minimumFractionDigits:2, maximumFractionDigits:2});
}

// ---- 页面绑定 ----
(function init(){
  const $amount = document.getElementById('amount');
  const $from = document.getElementById('from');
  const $to = document.getElementById('to');
  const $res = document.getElementById('result');
  const $swap = document.getElementById('swap');
  const $refresh = document.getElementById('refresh');
  if (!$amount) return;

  // 货币全名走 Intl.DisplayNames，不用维护 31×4 条词典
  Object.keys(CURRENCIES).forEach(code=>{
    const label = `${code} — ${tCurrency(code)}`;
    $from.appendChild(new Option(label, code));
    $to.appendChild(new Option(label, code));
  });
  $from.value = 'USD';
  $to.value = 'CNY';

  function render(){
    const a = parseFloat($amount.value);
    if (isNaN(a)){ $res.textContent = '—'; return; }
    const out = convert(a, $from.value, $to.value);
    $res.textContent = `${fmt(a)} ${$from.value} = ${fmt(out)} ${$to.value}`;
    if (ratesAreLive){
      const unit = convert(1, $from.value, $to.value);
      document.getElementById('rate').textContent =
        t('1 {a} = {b} {c} · live rates', { a: $from.value, b: fmt(unit), c: $to.value });
    }
  }

  function renderPopular(){
    const box = document.getElementById('popular');
    if (!box) return;
    const pairs = [['USD','EUR'],['USD','CNY'],['USD','JPY'],['EUR','GBP'],
                   ['USD','GBP'],['USD','KRW']];
    box.innerHTML = pairs.map(([f,t])=>{
      const v = fmt(convert(1, f, t));
      return `<div class="kv"><span>1 ${f}</span><span>${v} ${t}</span></div>`;
    }).join('');
  }

  ['input','change'].forEach(ev=>{
    $amount.addEventListener(ev, render);
    $from.addEventListener(ev, render);
    $to.addEventListener(ev, render);
  });

  $swap.addEventListener('click', ()=>{
    const a = $from.value; $from.value = $to.value; $to.value = a; render();
  });

  function reload(){
    loadRates().then(()=>{ render(); renderPopular(); });
  }

  $refresh.addEventListener('click', ()=>{
    document.getElementById('rate').textContent = t('Refreshing…');
    reload();
  });

  reload();
})();
