/* ==========================================================================
   base64.js — Base64 编解码
   支持：文本 ↔ Base64、URL-safe 变体、文件 → Data URI
   中文/emoji 用 TextEncoder/TextDecoder 走 UTF-8，不会乱码。
   ========================================================================== */

// ---- 文本 → Base64（UTF-8 安全）----
function encodeText(str, urlSafe){
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  const CHUNK = 0x8000;                       // 分块，避免大字符串爆栈
  for (let i = 0; i < bytes.length; i += CHUNK){
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  let b64 = btoa(bin);
  if (urlSafe) b64 = b64.replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  return b64;
}

// ---- Base64 → 文本 ----
function decodeText(b64){
  let s = b64.trim().replace(/\s+/g,'');
  // 容忍 URL-safe
  s = s.replace(/-/g,'+').replace(/_/g,'/');
  // 补齐 padding
  while (s.length % 4) s += '=';
  const bin = atob(s);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder('utf-8', { fatal:false }).decode(bytes);
}

// ---- 检测是不是合法 Base64 ----
function looksLikeBase64(s){
  const t = s.trim().replace(/\s+/g,'');
  if (!t || t.length < 4) return false;
  if (!/^[A-Za-z0-9+/_-]+={0,2}$/.test(t)) return false;
  // 长度合理（去掉 padding 后 %4 余数不能是 1）
  const noPad = t.replace(/=+$/,'');
  return noPad.length % 4 !== 1;
}

// ---- 文件 → Data URI ----
function fileToDataURI(file){
  return new Promise((resolve, reject)=>{
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

function humanSize(n){
  if (n < 1024) return n + ' B';
  if (n < 1048576) return (n/1024).toFixed(1) + ' KB';
  return (n/1048576).toFixed(2) + ' MB';
}

// ---- 页面绑定 ----
(function init(){
  const $in   = document.getElementById('input');
  const $out  = document.getElementById('output');
  const $enc  = document.getElementById('encode');
  const $dec  = document.getElementById('decode');
  const $swap = document.getElementById('swap');
  const $copy = document.getElementById('copy');
  const $clear= document.getElementById('clear');
  const $url  = document.getElementById('urlsafe');
  const $file = document.getElementById('file');
  const $fInfo= document.getElementById('fileInfo');
  const $stat = document.getElementById('status');
  if (!$in) return;

  function setStatus(msg, kind){
    $stat.textContent = msg;
    $stat.style.color = kind === 'err' ? 'var(--err)'
                      : kind === 'ok'  ? 'var(--ok)'
                      : 'var(--txt-dim)';
  }

  function doEncode(){
    const v = $in.value;
    if (!v){ $out.value = ''; setStatus(''); return; }
    try{
      $out.value = encodeText(v, $url.checked);
      setStatus(t('Encoded {a} chars → {b} chars', { a: v.length, b: $out.value.length }), 'ok');
    }catch(e){ setStatus(t('Encode failed: {msg}', { msg: e.message }), 'err'); }
  }

  function doDecode(){
    const v = $in.value;
    if (!v){ $out.value = ''; setStatus(''); return; }
    if (!looksLikeBase64(v)){
      setStatus(t('Input does not look like valid Base64'), 'err');
      $out.value = '';
      return;
    }
    try{
      $out.value = decodeText(v);
      setStatus(t('Decoded OK'), 'ok');
    }catch(e){
      setStatus(t('Decode failed: invalid Base64'), 'err');
      $out.value = '';
    }
  }

  $enc.addEventListener('click', doEncode);
  $dec.addEventListener('click', doDecode);
  $url.addEventListener('change', ()=>{ if ($in.value) doEncode(); });

  $swap.addEventListener('click', ()=>{
    const a = $in.value; $in.value = $out.value; $out.value = a;
    setStatus('');
  });

  $clear.addEventListener('click', ()=>{
    $in.value = ''; $out.value = ''; setStatus('');
    if ($fInfo) $fInfo.textContent = '';
  });

  $copy.addEventListener('click', ()=>{
    if (!$out.value) return;
    navigator.clipboard.writeText($out.value).then(()=>{
      $copy.textContent = t('Copied!');
      setTimeout(()=>$copy.textContent = t('Copy result'), 1200);
    });
  });

  if ($file){
    $file.addEventListener('change', async ()=>{
      const f = $file.files[0];
      if (!f) return;
      try{
        const uri = await fileToDataURI(f);
        $out.value = uri;
        $fInfo.textContent = `${f.name} · ${humanSize(f.size)} → ${humanSize(uri.length)} (base64 +${Math.round((uri.length/f.size - 1)*100)}%)`;
        setStatus(t('File encoded to Data URI'), 'ok');
      }catch(e){ setStatus(t('File read failed'), 'err'); }
    });
  }

  // 输入时自动判断方向（不覆盖用户手动点按钮）
  $in.addEventListener('input', ()=>{
    if (!$in.value){ $out.value=''; setStatus(''); return; }
    if (looksLikeBase64($in.value)) doDecode(); else doEncode();
  });
})();
