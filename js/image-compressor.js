/* ==========================================================================
   image-compressor.js — 图片压缩
   用 Canvas 重绘：可调质量、可缩放、可转格式（JPEG/WebP/PNG）。
   全部在本地完成，不上传。
   ========================================================================== */

function humanSize(n){
  if (n < 1024) return n + ' B';
  if (n < 1048576) return (n/1024).toFixed(1) + ' KB';
  return (n/1048576).toFixed(2) + ' MB';
}

// 计算目标尺寸（保持比例）
function targetSize(w, h, maxW, maxH){
  let tw = w, th = h;
  if (maxW && w > maxW){ tw = maxW; th = h * (maxW / w); }
  if (maxH && th > maxH){ th = maxH; tw = tw * (maxH / th); }
  return { w: Math.round(tw), h: Math.round(th) };
}

function loadImage(file){
  return new Promise((resolve, reject)=>{
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Cannot read image')); };
    img.src = url;
  });
}

async function compress(file, opts){
  const img = await loadImage(file);
  const { w, h } = targetSize(img.naturalWidth, img.naturalHeight, opts.maxW, opts.maxH);

  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');

  // JPEG 不支持透明，先铺白底
  if (opts.format === 'image/jpeg'){
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
  }
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, w, h);

  const blob = await new Promise(res => canvas.toBlob(res, opts.format, opts.quality));
  return {
    blob,
    width: w,
    height: h,
    srcW: img.naturalWidth,
    srcH: img.naturalHeight,
    srcSize: file.size,
    outSize: blob ? blob.size : 0
  };
}

// ---- 页面绑定 ----
(function init(){
  const $file = document.getElementById('file');
  const $drop = document.getElementById('drop');
  const $quality = document.getElementById('quality');
  const $qualityVal = document.getElementById('qualityVal');
  const $maxW = document.getElementById('maxw');
  const $format = document.getElementById('format');
  const $run = document.getElementById('run');
  const $result = document.getElementById('result');
  const $preview = document.getElementById('preview');
  const $download = document.getElementById('download');
  if (!$file) return;

  let currentFile = null;
  let outBlob = null;
  let outName = 'compressed';

  function pick(f){
    if (!f || !f.type.startsWith('image/')) return;
    currentFile = f;
    $preview.src = URL.createObjectURL(f);
    $preview.style.display = 'block';
    $result.innerHTML = `<div class="kv"><span>Original</span><span>${f.name} · ${humanSize(f.size)}</span></div>`;
    outBlob = null;
    $download.disabled = true;
  }

  $file.addEventListener('change', ()=> pick($file.files[0]));

  // 拖拽
  ['dragover','dragenter'].forEach(ev => $drop.addEventListener(ev, e => { e.preventDefault(); $drop.style.borderColor = 'var(--accent)'; }));
  ['dragleave','drop'].forEach(ev => $drop.addEventListener(ev, e => { e.preventDefault(); $drop.style.borderColor = 'var(--line)'; }));
  $drop.addEventListener('drop', e => pick(e.dataTransfer.files[0]));
  $drop.addEventListener('click', () => $file.click());

  $quality.addEventListener('input', ()=> $qualityVal.textContent = Math.round($quality.value * 100) + '%');

  $run.addEventListener('click', async ()=>{
    if (!currentFile){ $result.innerHTML = '<span class="muted">Pick an image first</span>'; return; }
    $run.disabled = true;
    $run.textContent = 'Compressing…';
    try{
      const opts = {
        quality: parseFloat($quality.value),
        maxW: parseInt($maxW.value, 10) || null,
        maxH: null,
        format: $format.value
      };
      const r = await compress(currentFile, opts);
      outBlob = r.blob;
      const ext = opts.format.split('/')[1];
      outName = currentFile.name.replace(/\.[^.]+$/, '') + '-min.' + (ext === 'jpeg' ? 'jpg' : ext);
      const saved = r.srcSize > 0 ? (1 - r.outSize / r.srcSize) * 100 : 0;
      $result.innerHTML = `
        <div class="kv"><span>Original</span><span>${r.srcW}×${r.srcH} · ${humanSize(r.srcSize)}</span></div>
        <div class="kv"><span>Output</span><span>${r.width}×${r.height} · ${humanSize(r.outSize)}</span></div>
        <div class="kv"><span>Saved</span><span style="color:${saved>0?'var(--ok)':'var(--warn)'}">${saved.toFixed(1)}%</span></div>
        <div class="kv"><span>Format</span><span>${ext.toUpperCase()}</span></div>`;
      $download.disabled = false;
      $preview.src = URL.createObjectURL(r.blob);
    }catch(e){
      $result.innerHTML = `<span style="color:var(--err)">${e.message}</span>`;
    }finally{
      $run.disabled = false;
      $run.textContent = 'Compress';
    }
  });

  $download.addEventListener('click', ()=>{
    if (!outBlob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(outBlob);
    a.download = outName;
    a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href), 3000);
  });
})();
