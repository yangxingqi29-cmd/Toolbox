/* ==========================================================================
   units.js — 单位换算
   每个类别里定义 "基准单位"，其他单位是相对基准的系数。
   温度不是简单乘系数，单独用函数处理。
   ========================================================================== */

// ---- 单位表：{ 单位key: [显示名, 相对基准的系数] } ----
// 基准单位在每类里第一个。系数 = 1 基准单位等于多少该单位时取倒数关系，
// 这里统一约定： value_in_base = value * factor
const UNITS = {
  length: {
    base: 'm',
    units: {
      m:  ['Meter (m)',        1],
      km: ['Kilometer (km)',   1000],
      cm: ['Centimeter (cm)',  0.01],
      mm: ['Millimeter (mm)',  0.001],
      mi: ['Mile (mi)',        1609.344],
      yd: ['Yard (yd)',        0.9144],
      ft: ['Foot (ft)',        0.3048],
      in: ['Inch (in)',        0.0254],
      nmi:['Nautical mile (nmi)', 1852],
    }
  },
  weight: {
    base: 'kg',
    units: {
      kg: ['Kilogram (kg)',    1],
      g:  ['Gram (g)',         0.001],
      mg: ['Milligram (mg)',   0.000001],
      t:  ['Metric ton (t)',   1000],
      lb: ['Pound (lb)',       0.45359237],
      oz: ['Ounce (oz)',       0.028349523125],
      st: ['Stone (st)',       6.35029318],
    }
  },
  area: {
    base: 'm2',
    units: {
      m2:  ['Square meter (m²)',      1],
      km2: ['Square kilometer (km²)', 1000000],
      cm2: ['Square centimeter (cm²)',0.0001],
      ha:  ['Hectare (ha)',           10000],
      ac:  ['Acre (ac)',              4046.8564224],
      ft2: ['Square foot (ft²)',      0.09290304],
      in2: ['Square inch (in²)',      0.00064516],
      mi2: ['Square mile (mi²)',      2589988.110336],
    }
  },
  volume: {
    base: 'l',
    units: {
      l:   ['Liter (L)',        1],
      ml:  ['Milliliter (mL)',  0.001],
      m3:  ['Cubic meter (m³)', 1000],
      gal: ['US gallon (gal)',  3.785411784],
      qt:  ['US quart (qt)',    0.946352946],
      pt:  ['US pint (pt)',     0.473176473],
      cup: ['US cup',           0.2365882365],
      floz:['US fluid ounce (fl oz)', 0.0295735295625],
      galuk:['UK gallon (gal UK)', 4.54609],
    }
  },
  speed: {
    base: 'ms',
    units: {
      ms:  ['Meter/second (m/s)',   1],
      kmh: ['Kilometer/hour (km/h)',0.2777777777777778],
      mph: ['Mile/hour (mph)',      0.44704],
      kn:  ['Knot (kn)',            0.5144444444444445],
      fts: ['Foot/second (ft/s)',   0.3048],
    }
  },
  time: {
    base: 's',
    units: {
      s:   ['Second (s)',    1],
      ms:  ['Millisecond (ms)', 0.001],
      min: ['Minute (min)',  60],
      h:   ['Hour (h)',      3600],
      d:   ['Day (d)',       86400],
      wk:  ['Week (wk)',     604800],
      mo:  ['Month (30d)',   2592000],
      yr:  ['Year (365d)',   31536000],
    }
  },
  data: {
    base: 'b',
    units: {
      b:   ['Byte (B)',      1],
      bit: ['Bit (b)',       0.125],
      kb:  ['Kilobyte (KB)', 1024],
      mb:  ['Megabyte (MB)', 1048576],
      gb:  ['Gigabyte (GB)', 1073741824],
      tb:  ['Terabyte (TB)', 1099511627776],
    }
  },
  // 温度特殊处理
  temperature: {
    base: 'c',
    special: true,
    units: {
      c: ['Celsius (°C)',   1],
      f: ['Fahrenheit (°F)',1],
      k: ['Kelvin (K)',     1],
    }
  }
};

// ---- 温度换算：全部先转成摄氏 ----
function tempToC(v, unit){
  if (unit === 'c') return v;
  if (unit === 'f') return (v - 32) * 5 / 9;
  if (unit === 'k') return v - 273.15;
  return v;
}
function tempFromC(c, unit){
  if (unit === 'c') return c;
  if (unit === 'f') return c * 9 / 5 + 32;
  if (unit === 'k') return c + 273.15;
  return c;
}

// ---- 通用换算 ----
function convert(value, category, from, to){
  const cat = UNITS[category];
  if (!cat) return NaN;

  if (cat.special){ // 温度
    return tempFromC(tempToC(value, from), to);
  }
  const fFactor = cat.units[from][1];
  const tFactor = cat.units[to][1];
  const baseValue = value * fFactor;
  return baseValue / tFactor;
}

// ---- 智能格式化：去掉无意义的尾零，极大极小用科学计数 ----
function fmt(n){
  if (!isFinite(n)) return '—';
  if (n === 0) return '0';
  const abs = Math.abs(n);
  if (abs >= 1e12 || abs < 1e-6) return n.toExponential(6);
  let s = n.toPrecision(10);
  if (s.includes('.')) s = s.replace(/0+$/,'').replace(/\.$/,'');
  return s;
}

// ---- 页面绑定 ----
(function init(){
  const $cat  = document.getElementById('category');
  const $from = document.getElementById('from');
  const $to   = document.getElementById('to');
  const $val  = document.getElementById('value');
  const $res  = document.getElementById('result');
  const $fml  = document.getElementById('formula');
  const $swap = document.getElementById('swap');
  const $copy = document.getElementById('copy');
  if (!$cat) return;

  // 单位显示名走 i18n：按该类别里单位的序号取翻译，取不到就用英文原名
  function unitName(catKey, k){
    const cat = UNITS[catKey];
    const idx = Object.keys(cat.units).indexOf(k);
    return tUnit(catKey, idx, cat.units[k][0]);
  }

  function fillUnits(){
    const cat = UNITS[$cat.value];
    const keys = Object.keys(cat.units);
    $from.innerHTML = '';
    $to.innerHTML = '';
    keys.forEach(k=>{
      const name = unitName($cat.value, k);
      $from.appendChild(new Option(name, k));
      $to.appendChild(new Option(name, k));
    });
    $from.value = keys[0];
    $to.value   = keys[Math.min(1, keys.length-1)];
    render();
  }

  function render(){
    const v = parseFloat($val.value);
    if (isNaN(v)){ $res.textContent = '—'; $fml.textContent=''; return; }
    const out = convert(v, $cat.value, $from.value, $to.value);
    const fromName = unitName($cat.value, $from.value);
    const toName   = unitName($cat.value, $to.value);
    $res.textContent = fmt(out);
    $res.classList.remove('err');
    $fml.textContent = `${fmt(v)} ${fromName} = ${fmt(out)} ${toName}`;
  }

  $cat.addEventListener('change', fillUnits);
  ['input','change'].forEach(ev=>{
    $from.addEventListener(ev, render);
    $to.addEventListener(ev, render);
    $val.addEventListener(ev, render);
  });

  $swap.addEventListener('click', ()=>{
    const a = $from.value;
    $from.value = $to.value;
    $to.value = a;
    render();
  });

  $copy.addEventListener('click', ()=>{
    navigator.clipboard.writeText($res.textContent).then(()=>{
      $copy.textContent = t('Copied!');
      setTimeout(()=>$copy.textContent = t('Copy result'), 1200);
    });
  });

  fillUnits();
})();
