/* ==========================================================================
   json-formatter.js — JSON 格式化 / 压缩 / 校验
   纯逻辑在上，页面绑定在下。
   ========================================================================== */

// ---- 校验器：自己走一遍 RFC 8259，拿到精确的出错下标 ----
// 不依赖 V8 的错误消息格式（新版 V8 的 "Unexpected token" 已经不带 position 了）。
// 成功返回 {ok:true}，失败返回 {ok:false, error:{message,line,col,index}}。
function jsonValidate(text){
  const s = text, n = s.length;
  let i = 0;

  // code 就是 i18n 的 key（英文原文），args 填 {c} 这类占位符。
  // 校验器只管报「哪个 key + 什么参数 + 在哪个下标」，翻译由页面层做。
  const fail = (code, args, idx) => {
    throw { __json:true, code, args: args || null, idx: idx === undefined ? i : idx };
  };
  const ws = () => { while (i < n && (s[i] === ' ' || s[i] === '\t' || s[i] === '\n' || s[i] === '\r')) i++; };

  function str(){
    const start = i;
    i++;                                            // 开引号
    while (i < n){
      const c = s[i];
      if (c === '"'){ i++; return; }
      if (c === '\\'){
        i++;
        if (i >= n) fail('Unterminated string', null, start);
        const e = s[i];
        if (e === 'u'){
          if (!/^[0-9a-fA-F]{4}$/.test(s.slice(i + 1, i + 5)))
            fail('Invalid \\u escape — expected 4 hex digits', null, i);
          i += 5;
        } else if ('"\\/bfnrt'.indexOf(e) >= 0){
          i++;
        } else {
          fail("Invalid escape '\\{c}'", { c: e }, i);
        }
        continue;
      }
      if (c.charCodeAt(0) < 0x20) fail('Control character in string — it must be escaped', null, i);
      i++;
    }
    fail('Unterminated string', null, start);
  }

  function num(){
    const start = i;
    if (s[i] === '-') i++;
    if (s[i] === '0'){ i++; }
    else if (s[i] >= '1' && s[i] <= '9'){ while (s[i] >= '0' && s[i] <= '9') i++; }
    else fail('Invalid number', null, start);
    if (s[i] === '.'){
      i++;
      if (!(s[i] >= '0' && s[i] <= '9'))
        fail('Invalid number — expected a digit after the decimal point', null, i);
      while (s[i] >= '0' && s[i] <= '9') i++;
    }
    if (s[i] === 'e' || s[i] === 'E'){
      i++;
      if (s[i] === '+' || s[i] === '-') i++;
      if (!(s[i] >= '0' && s[i] <= '9'))
        fail('Invalid number — expected a digit in the exponent', null, i);
      while (s[i] >= '0' && s[i] <= '9') i++;
    }
  }

  function lit(word){
    if (s.slice(i, i + word.length) !== word)
      fail("Unexpected token '{c}' — expected a value", { c: s[i] });
    i += word.length;
  }

  function arr(){
    i++;                                            // [
    ws();
    if (s[i] === ']'){ i++; return; }
    for (;;){
      value();
      ws();
      if (s[i] === ','){ i++; ws(); if (s[i] === ']') fail('Trailing comma is not allowed in JSON'); continue; }
      if (s[i] === ']'){ i++; return; }
      if (i >= n) fail('Unexpected end of input — the array is not closed');
      fail("Expected ',' or ']' but found '{c}'", { c: s[i] });
    }
  }

  function obj(){
    i++;                                            // {
    ws();
    if (s[i] === '}'){ i++; return; }
    for (;;){
      ws();
      if (s[i] !== '"'){
        if (i >= n) fail('Unexpected end of input — the object is not closed');
        fail("Expected a double-quoted property name but found '{c}'", { c: s[i] });
      }
      str();
      ws();
      if (s[i] !== ':'){
        if (i >= n) fail("Unexpected end of input — expected ':'");
        fail("Expected ':' after the property name but found '{c}'", { c: s[i] });
      }
      i++;
      value();
      ws();
      if (s[i] === ','){ i++; ws(); if (s[i] === '}') fail('Trailing comma is not allowed in JSON'); continue; }
      if (s[i] === '}'){ i++; return; }
      if (i >= n) fail('Unexpected end of input — the object is not closed');
      fail("Expected ',' or '}' but found '{c}'", { c: s[i] });
    }
  }

  function value(){
    ws();
    if (i >= n) fail('Unexpected end of input — expected a value');
    const c = s[i];
    if (c === '{') return obj();
    if (c === '[') return arr();
    if (c === '"') return str();
    if (c === '-' || (c >= '0' && c <= '9')) return num();
    if (c === 't') return lit('true');
    if (c === 'f') return lit('false');
    if (c === 'n') return lit('null');
    fail("Unexpected token '{c}' — expected a value", { c: c });
  }

  try{
    value();
    ws();
    if (i < n) fail("Unexpected token '{c}' after the JSON value", { c: s[i] });
    return { ok:true };
  }catch(e){
    if (e && e.__json){
      const idx = Math.min(e.idx, n);
      let line = 1, col = 1;
      for (let k = 0; k < idx; k++){
        if (s[k] === '\n'){ line++; col = 1; } else col++;
      }
      return { ok:false, error:{ code: e.code, args: e.args, line, col, index: idx } };
    }
    throw e;
  }
}

// ---- 解析：返回 {ok, value, error:{message,line,col}} ----
function parseJSON(text){
  const src = text.trim();
  if (!src) return { ok:false, error:{ code:'Empty input', args:null, line:0, col:0 } };
  const v = jsonValidate(src);
  if (!v.ok) return v;
  return { ok:true, value: JSON.parse(src) };
}

// ---- 键排序（递归）----
function sortKeysDeep(v){
  if (Array.isArray(v)) return v.map(sortKeysDeep);
  if (v && typeof v === 'object'){
    const out = {};
    Object.keys(v).sort().forEach(k => out[k] = sortKeysDeep(v[k]));
    return out;
  }
  return v;
}

// ---- 输出 ----
function stringifyJSON(value, indent, sortKeys){
  const v = sortKeys ? sortKeysDeep(value) : value;
  return JSON.stringify(v, null, indent);
}
function minifyJSON(value){
  return JSON.stringify(value);
}

// ---- 统计 ----
function jsonStats(value){
  let nodes = 0, depth = 0, keys = 0;
  (function walk(v, d){
    nodes++;
    depth = Math.max(depth, d);
    if (Array.isArray(v)) v.forEach(x => walk(x, d + 1));
    else if (v && typeof v === 'object'){
      const ks = Object.keys(v);
      keys += ks.length;
      ks.forEach(k => walk(v[k], d + 1));
    }
  })(value, 1);
  return { nodes, depth, keys };
}

// ---- 页面绑定 ----
(function init(){
  const $in    = document.getElementById('input');
  const $out   = document.getElementById('output');
  const $indent= document.getElementById('indent');
  const $sort  = document.getElementById('sortkeys');
  const $fmt   = document.getElementById('format');
  const $min   = document.getElementById('minify');
  const $copy  = document.getElementById('copy');
  const $clear = document.getElementById('clear');
  const $stat  = document.getElementById('status');
  if (!$in) return;

  function setStatus(msg, kind){
    $stat.textContent = msg;
    $stat.style.color = kind === 'err' ? 'var(--err)' : kind === 'ok' ? 'var(--ok)' : 'var(--txt-dim)';
  }

  function run(minify){
    const r = parseJSON($in.value);
    if (!r.ok){
      $out.value = '';
      const loc = r.error.line
        ? ' ' + t('(line {l}, col {c})', { l: r.error.line, c: r.error.col })
        : '';
      setStatus(t('Invalid JSON') + loc + ' — ' + t(r.error.code, r.error.args), 'err');
      return;
    }
    const indent = parseInt($indent.value, 10);
    $out.value = minify ? minifyJSON(r.value) : stringifyJSON(r.value, indent, $sort.checked);
    const s = jsonStats(r.value);
    const bytes = new Blob([$out.value]).size;
    setStatus(t('Valid JSON · {k} keys · depth {d} · {b} bytes',
                { k: s.keys, d: s.depth, b: bytes }), 'ok');
  }

  $fmt.addEventListener('click', ()=>run(false));
  $min.addEventListener('click', ()=>run(true));
  $indent.addEventListener('change', ()=>{ if ($out.value || $in.value) run(false); });
  $sort.addEventListener('change', ()=>{ if ($in.value) run(false); });

  $clear.addEventListener('click', ()=>{ $in.value=''; $out.value=''; setStatus(''); });
  $copy.addEventListener('click', ()=>{
    if (!$out.value) return;
    navigator.clipboard.writeText($out.value).then(()=>{
      $copy.textContent = t('Copied!');
      setTimeout(()=>$copy.textContent = t('Copy result'), 1200);
    });
  });

  $in.addEventListener('input', ()=>{ if ($in.value.trim()) run(false); else { $out.value=''; setStatus(''); } });
})();
