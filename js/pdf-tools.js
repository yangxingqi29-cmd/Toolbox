/* ==========================================================================
   pdf-tools.js — PDF 合并 / 拆分
   依赖 pdf-lib（CDN 加载）。所有处理在本地完成，不上传。
   页面里通过 window.PDFLib 使用。
   ========================================================================== */

function lib(){ return window.PDFLib; }

function humanSize(n){
  if (n < 1024) return n + ' B';
  if (n < 1048576) return (n/1024).toFixed(1) + ' KB';
  return (n/1048576).toFixed(2) + ' MB';
}

async function readPdf(file){
  const buf = await file.arrayBuffer();
  return lib().PDFDocument.load(buf, { ignoreEncryption:true });
}

// ---- 合并 ----
async function mergePdfs(files){
  const out = await lib().PDFDocument.create();
  let pages = 0;
  for (const f of files){
    const doc = await readPdf(f);
    const copied = await out.copyPages(doc, doc.getPageIndices());
    copied.forEach(p => out.addPage(p));
    pages += copied.length;
  }
  return { bytes: await out.save(), pages };
}

// ---- 拆分：按页范围提取 ----
// range 形如 "1-3,5,7-9"
function parseRange(str, max){
  const out = [];
  str.split(',').forEach(part=>{
    const p = part.trim();
    if (!p) return;
    const m = /^(\d+)\s*-\s*(\d+)$/.exec(p);
    if (m){
      let a = parseInt(m[1],10), b = parseInt(m[2],10);
      if (a > b) [a,b] = [b,a];
      for (let i = a; i <= b; i++) if (i>=1 && i<=max) out.push(i-1);
    } else if (/^\d+$/.test(p)){
      const n = parseInt(p,10);
      if (n>=1 && n<=max) out.push(n-1);
    }
  });
  return [...new Set(out)];
}

async function extractPages(file, rangeStr){
  const doc = await readPdf(file);
  const total = doc.getPageCount();
  const idx = parseRange(rangeStr, total);
  if (!idx.length) throw new Error(`No valid pages. This PDF has ${total} pages.`);
  const out = await lib().PDFDocument.create();
  const copied = await out.copyPages(doc, idx);
  copied.forEach(p => out.addPage(p));
  return { bytes: await out.save(), pages: copied.length, total };
}

// ---- 页面绑定 ----
(function init(){
  if (!document.getElementById('mergeList')) return;

  const $mergeList = document.getElementById('mergeList');
  const $mergeInput = document.getElementById('mergeInput');
  const $mergeBtn = document.getElementById('mergeBtn');
  const $mergeDrop = document.getElementById('mergeDrop');
  const $splitInput = document.getElementById('splitInput');
  const $splitRange = document.getElementById('splitRange');
  const $splitBtn = document.getElementById('splitBtn');
  const $status = document.getElementById('pdfStatus');

  let mergeFiles = [];

  function status(msg, kind){
    $status.textContent = msg;
    $status.style.color = kind === 'err' ? 'var(--err)' : kind === 'ok' ? 'var(--ok)' : 'var(--txt-dim)';
  }

  function renderList(){
    if (!mergeFiles.length){ $mergeList.innerHTML = '<span class="muted">No files selected</span>'; return; }
    $mergeList.innerHTML = mergeFiles.map((f,i)=>
      `<div class="kv"><span>${i+1}. ${f.name}</span><span>${humanSize(f.size)} <button class="btn ghost sm" data-rm="${i}" style="margin-left:8px">×</button></span></div>`
    ).join('');
    $mergeList.querySelectorAll('[data-rm]').forEach(b=>{
      b.addEventListener('click', ()=>{ mergeFiles.splice(+b.dataset.rm,1); renderList(); });
    });
  }

  function addFiles(list){
    [...list].filter(f => f.type === 'application/pdf' || /\.pdf$/i.test(f.name))
      .forEach(f => mergeFiles.push(f));
    renderList();
  }

  $mergeInput.addEventListener('change', ()=> addFiles($mergeInput.files));
  ['dragover','dragenter'].forEach(ev => $mergeDrop.addEventListener(ev, e=>{e.preventDefault();$mergeDrop.style.borderColor='var(--accent)';}));
  ['dragleave','drop'].forEach(ev => $mergeDrop.addEventListener(ev, e=>{e.preventDefault();$mergeDrop.style.borderColor='var(--line)';}));
  $mergeDrop.addEventListener('drop', e => addFiles(e.dataTransfer.files));
  $mergeDrop.addEventListener('click', ()=> $mergeInput.click());

  function download(bytes, name){
    const blob = new Blob([bytes], {type:'application/pdf'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href), 5000);
  }

  $mergeBtn.addEventListener('click', async ()=>{
    if (mergeFiles.length < 2){ status('Select at least 2 PDF files', 'err'); return; }
    $mergeBtn.disabled = true; $mergeBtn.textContent = 'Merging…';
    try{
      const r = await mergePdfs(mergeFiles);
      download(r.bytes, 'merged.pdf');
      status(`Merged ${mergeFiles.length} files → ${r.pages} pages · ${humanSize(r.bytes.byteLength)}`, 'ok');
    }catch(e){ status('Merge failed: ' + e.message, 'err'); }
    finally{ $mergeBtn.disabled = false; $mergeBtn.textContent = 'Merge PDFs'; }
  });

  $splitBtn.addEventListener('click', async ()=>{
    const f = $splitInput.files[0];
    if (!f){ status('Select a PDF to split', 'err'); return; }
    $splitBtn.disabled = true; $splitBtn.textContent = 'Extracting…';
    try{
      const r = await extractPages(f, $splitRange.value || '1');
      download(r.bytes, 'extracted.pdf');
      status(`Extracted ${r.pages} of ${r.total} pages · ${humanSize(r.bytes.byteLength)}`, 'ok');
    }catch(e){ status('Split failed: ' + e.message, 'err'); }
    finally{ $splitBtn.disabled = false; $splitBtn.textContent = 'Extract pages'; }
  });
})();
