/* ==========================================================================
   password.js — 强随机密码生成
   用 crypto.getRandomValues（CSPRNG），不是 Math.random。
   拒绝采样避免取模偏差，保证均匀分布。
   ========================================================================== */

const SETS = {
  upper:   'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lower:   'abcdefghijklmnopqrstuvwxyz',
  digits:  '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.<>?/~'
};
const AMBIGUOUS = '0Oo1lI|';

// ---- 均匀随机整数 [0, max) ----
function randInt(max){
  const limit = Math.floor(0xFFFFFFFF / max) * max;
  const buf = new Uint32Array(1);
  let x;
  do {
    crypto.getRandomValues(buf);
    x = buf[0];
  } while (x >= limit);
  return x % max;
}

// ---- 生成密码 ----
function generate(opts){
  let pool = '';
  for (const k of ['upper','lower','digits','symbols']){
    if (opts[k]) pool += SETS[k];
  }
  if (opts.noAmb){
    pool = [...pool].filter(c => !AMBIGUOUS.includes(c)).join('');
  }
  if (!pool) pool = SETS.lower + SETS.digits;

  // 至少包含每个选中的类别各一个，再补齐长度
  let chars = [];
  for (const k of ['upper','lower','digits','symbols']){
    if (!opts[k]) continue;
    let set = SETS[k];
    if (opts.noAmb) set = [...set].filter(c=>!AMBIGUOUS.includes(c)).join('');
    if (set.length) chars.push(set[randInt(set.length)]);
  }
  while (chars.length < opts.length){
    chars.push(pool[randInt(pool.length)]);
  }
  chars = chars.slice(0, opts.length);

  // Fisher–Yates 洗牌，避免类别位置固定
  for (let i = chars.length - 1; i > 0; i--){
    const j = randInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

// ---- 强度评估：按字符集大小和长度算熵（bit） ----
function strength(pwd, poolSize){
  const bits = pwd.length * Math.log2(poolSize || 94);
  let label = 'Weak', color = 'var(--err)', pct = 20;
  if (bits >= 128){ label = 'Very strong'; color = 'var(--ok)';   pct = 100; }
  else if (bits >= 90){ label = 'Strong';   color = 'var(--ok)';   pct = 80; }
  else if (bits >= 60){ label = 'Fair';     color = 'var(--warn)'; pct = 55; }
  else if (bits >= 40){ label = 'Weak';     color = 'var(--warn)'; pct = 35; }
  return { bits: Math.round(bits), label, color, pct };
}

// ---- 页面绑定 ----
(function init(){
  const $pwd = document.getElementById('pwd');
  const $bar = document.getElementById('bar');
  const $txt = document.getElementById('strengthTxt');
  const $len = document.getElementById('length');
  const $lenVal = document.getElementById('lenVal');
  const $gen = document.getElementById('gen');
  const $copy = document.getElementById('copy');
  const opts = () => ({
    upper:   document.getElementById('upper').checked,
    lower:   document.getElementById('lower').checked,
    digits:  document.getElementById('digits').checked,
    symbols: document.getElementById('symbols').checked,
    noAmb:   document.getElementById('noAmb').checked,
    length:  parseInt($len.value, 10)
  });
  if (!$pwd) return;

  function run(){
    const o = opts();
    const pwd = generate(o);
    $pwd.textContent = pwd;

    // 计算实际字符集大小用于强度
    let size = 0;
    for (const k of ['upper','lower','digits','symbols']){
      let s = SETS[k];
      if (o.noAmb) s = [...s].filter(c=>!AMBIGUOUS.includes(c)).join('');
      if (o[k]) size += s.length;
    }
    const st = strength(pwd, size);
    $bar.style.width = st.pct + '%';
    $bar.style.background = st.color;
    // st.label 本身就是英文 key（Weak / Fair / Strong / Very strong），直接查表
    $txt.textContent = t('{label} · ~{bits} bits of entropy', { label: t(st.label), bits: st.bits });
  }

  $len.addEventListener('input', ()=>{ $lenVal.textContent = $len.value; run(); });
  ['upper','lower','digits','symbols','noAmb'].forEach(id=>{
    document.getElementById(id).addEventListener('change', run);
  });
  $gen.addEventListener('click', run);

  $copy.addEventListener('click', ()=>{
    navigator.clipboard.writeText($pwd.textContent).then(()=>{
      $copy.textContent = t('Copied!');
      setTimeout(()=>$copy.textContent = t('Copy'), 1200);
    });
  });

  run();
})();
