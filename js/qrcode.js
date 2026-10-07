/* ==========================================================================
   qrcode.js — QR 码生成（Canvas 渲染）
   说明：完整 QR 编码器（Reed-Solomon + 掩码）代码量大，这里用一个
   自包含的最小实现覆盖 byte 模式 + 自动版本 + 4 级纠错。
   如需更省的方案：把 <script src="https://cdn.jsdelivr.net/npm/qrcodejs/...">
   换进来即可，但为满足"离线可用"这里内嵌。
   ========================================================================== */

/* ---------- 1. GF(256) 运算，用于 Reed-Solomon ---------- */
const EXP = new Uint8Array(512), LOG = new Uint8Array(256);
(function(){
  let x = 1;
  for (let i = 0; i < 255; i++){ EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 0x100) x ^= 0x11d; }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();
function gfMul(a,b){ return (a === 0 || b === 0) ? 0 : EXP[LOG[a] + LOG[b]]; }

function rsGenerator(degree){
  let poly = [1];
  for (let i = 0; i < degree; i++){
    const next = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++){
      next[j]     ^= gfMul(poly[j], 1);
      next[j + 1] ^= gfMul(poly[j], EXP[i]);
    }
    poly = next;
  }
  return poly;
}
function rsEncode(data, degree){
  const gen = rsGenerator(degree);
  const res = new Uint8Array(data.length + degree);
  res.set(data);
  for (let i = 0; i < data.length; i++){
    const coef = res[i];
    if (coef !== 0){
      for (let j = 0; j < gen.length; j++) res[i + j] ^= gfMul(gen[j], coef);
    }
  }
  return res.slice(data.length);
}

/* ---------- 2. 容量表（byte 模式），按版本和纠错级 ---------- */
// 每个版本：[totalCodewords, dataCodewords{L,M,Q,H}, ecCodewordsPerBlock{L,M,Q,H},
//            blocks{L,M,Q,H}] —— 采用 QR 标准 v1..v10 常用区间
const CAP = [
  // ver  tot  dataL dataM dataQ dataH  ecL ecM ecQ ecH  bL bM bQ bH
  [1,   26,  19, 16, 13,  9,  7, 10, 13, 17,  1, 1, 1, 1],
  [2,   44,  34, 28, 22, 16, 10, 16, 22, 28,  1, 1, 1, 1],
  [3,   70,  55, 44, 34, 26, 15, 26, 18, 22,  1, 1, 2, 2],
  [4,  100,  80, 64, 48, 36, 20, 18, 26, 16,  1, 2, 2, 4],
  [5,  134, 108, 86, 62, 46, 26, 24, 18, 22,  1, 2, 4, 4],
  [6,  172, 136,108, 76, 60, 18, 16, 24, 28,  2, 4, 4, 4],
  [7,  196, 156,124, 88, 66, 20, 18, 18, 26,  2, 4, 6, 5],
  [8,  242, 194,154,110, 86, 24, 22, 22, 26,  2, 4, 6, 6],
  [9,  292, 232,182,132,100, 30, 22, 20, 24,  2, 5, 8, 8],
  [10, 346, 274,216,154,122, 18, 26, 24, 28,  4, 6, 8, 8],
];
const ECC_INDEX = { L:0, M:1, Q:2, H:3 };

function byteLenForVersion(v){ return v < 10 ? 8 : 16; }

function charCountBits(version, mode){
  // mode: 4=byte
  if (version < 10) return 8;
  if (version < 27) return 16;
  return 16;
}

/* ---------- 3. 编码数据为 bit 流 ---------- */
function toBits(bytes, version, eccLevel){
  const dataLen = CAP[version-1][1 + ECC_INDEX[eccLevel] + 1];
  const bits = [];
  const push = (val, len) => { for (let i = len-1; i >= 0; i--) bits.push((val >> i) & 1); };

  push(0b0100, 4);                       // byte 模式
  push(bytes.length, charCountBits(version, 4));
  bytes.forEach(b => push(b, 8));

  // 终止符
  const capacity = dataLen * 8;
  for (let i = 0; i < 4 && bits.length < capacity; i++) bits.push(0);
  while (bits.length % 8 !== 0) bits.push(0);

  // 填充字节
  const padBytes = [0xEC, 0x11];
  let pi = 0;
  while (bits.length < capacity){ push(padBytes[pi++ % 2], 8); }
  return bits;
}

function bitsToBytes(bits){
  const out = new Uint8Array(bits.length / 8);
  for (let i = 0; i < out.length; i++){
    let b = 0;
    for (let j = 0; j < 8; j++) b = (b << 1) | bits[i*8 + j];
    out[i] = b;
  }
  return out;
}

/* ---------- 4. 分块 + 纠错 + 交织 ---------- */
function buildCodewords(bytes, version, eccLevel){
  const row = CAP[version-1];
  const dataLen   = row[1 + ECC_INDEX[eccLevel] + 1];
  const ecLen     = row[5 + ECC_INDEX[eccLevel]];
  const blocks    = row[9 + ECC_INDEX[eccLevel]];

  const bits = toBits(bytes, version, eccLevel);
  const data = bitsToBytes(bits);

  const totalData   = dataLen;
  const blockDataLen = Math.floor(totalData / blocks);
  const extraBlocks  = totalData % blocks;

  const dataBlocks = [], ecBlocks = [];
  let offset = 0;
  for (let b = 0; b < blocks; b++){
    const len = blockDataLen + (b < extraBlocks ? 1 : 0);
    const blk = data.slice(offset, offset + len);
    offset += len;
    dataBlocks.push(blk);
    ecBlocks.push(rsEncode(blk, ecLen));
  }

  // 交织
  const result = [];
  const maxData = Math.max(...dataBlocks.map(b=>b.length));
  for (let i = 0; i < maxData; i++)
    for (const blk of dataBlocks) if (i < blk.length) result.push(blk[i]);
  for (let i = 0; i < ecLen; i++)
    for (const blk of ecBlocks) result.push(blk[i]);

  return new Uint8Array(result);
}

/* ---------- 5. 构造矩阵 ---------- */
function newMatrix(size){
  return Array.from({length:size}, () => new Array(size).fill(null));
}
function alignmentPositions(version){
  if (version === 1) return [];
  const step = version < 7 ? 8 : 10;
  const pos = [6];
  for (let p = version * 4 + 10; p > 6; p -= step) pos.unshift(p);
  if (pos[0] !== 6) pos.unshift(6);
  return pos;
}
function placeFunctionPatterns(m, version){
  const size = m.length;

  // 定位图案
  const fp = (r,c) => {
    for (let i = 0; i < 7; i++)
      for (let j = 0; j < 7; j++){
        const on = (i===0||i===6||j===0||j===6) || (i>=2&&i<=4&&j>=2&&j<=4);
        m[r+i][c+j] = on ? 1 : 0;
      }
  };
  fp(0,0); fp(0,size-7); fp(size-7,0);

  // 分隔符
  for (let i = 0; i < 8; i++){
    if (m[7][i] === null) m[7][i] = 0;
    if (m[i][7] === null) m[i][7] = 0;
    if (m[7][size-1-i] === null) m[7][size-1-i] = 0;
    if (m[size-8][i] === null) m[size-8][i] = 0;
    if (m[i][size-8] === null) m[i][size-8] = 0;
    if (m[size-1-i][7] === null) m[size-1-i][7] = 0;
  }

  // 时序图案
  for (let i = 8; i < size-8; i++){
    m[6][i] = (i % 2 === 0) ? 1 : 0;
    m[i][6] = (i % 2 === 0) ? 1 : 0;
  }

  // 校正图案
  const al = alignmentPositions(version);
  for (const r of al) for (const c of al){
    if ((r===6&&c===6)||(r===6&&c===size-7)||(r===size-7&&c===6)) continue;
    for (let i=-2;i<=2;i++) for (let j=-2;j<=2;j++){
      const on = Math.max(Math.abs(i),Math.abs(j)) !== 1;
      m[r+i][c+j] = on ? 1 : 0;
    }
  }

  // 固定黑点
  m[size-8][8] = 1;

  // 预留格式信息区
  for (let i = 0; i < 9; i++){
    if (m[8][i] === null) m[8][i] = 0;
    if (m[i][8] === null) m[i][8] = 0;
    if (m[8][size-1-i] === null) m[8][size-1-i] = 0;
    if (m[size-1-i][8] === null) m[size-1-i][8] = 0;
  }
  if (version >= 7){
    for (let i = 0; i < 6; i++)
      for (let j = 0; j < 3; j++){
        m[size-11+j][i] = m[size-11+j][i] ?? 0;
        m[i][size-11+j] = m[i][size-11+j] ?? 0;
      }
  }
}

function maskFn(id, r, c){
  switch(id){
    case 0: return (r + c) % 2 === 0;
    case 1: return r % 2 === 0;
    case 2: return c % 3 === 0;
    case 3: return (r + c) % 3 === 0;
    case 4: return (Math.floor(r/2) + Math.floor(c/3)) % 2 === 0;
    case 5: return (r*c) % 2 + (r*c) % 3 === 0;
    case 6: return ((r*c) % 2 + (r*c) % 3) % 2 === 0;
    case 7: return ((r+c) % 2 + (r*c) % 3) % 2 === 0;
  }
}
const FORMAT_TABLE = [
  0x77c4,0x72f3,0x7daa,0x789d,0x662f,0x6318,0x6c41,0x6976,
  0x5412,0x5125,0x5e7c,0x5b4b,0x45f9,0x40ce,0x4f97,0x4aa0
];
const ECC_BITS = { L:0b01, M:0b00, Q:0b11, H:0b10 };

function applyFormat(m, eccLevel, maskId){
  const size = m.length;
  const data = (ECC_BITS[eccLevel] << 3) | maskId;
  const bits = FORMAT_TABLE[data];
  const get = i => ((bits >> i) & 1) === 1;

  // 左上 + 右上
  for (let i = 0; i < 6; i++) m[8][i] = get(i) ? 1 : 0;
  m[8][7] = get(6) ? 1 : 0;
  m[8][8] = get(7) ? 1 : 0;
  m[7][8] = get(8) ? 1 : 0;
  for (let i = 9; i < 15; i++) m[14-i][8] = get(i) ? 1 : 0;

  // 左下 + 右上
  for (let i = 0; i < 8; i++) m[size-1-i][8] = get(i) ? 1 : 0;
  for (let i = 8; i < 15; i++) m[8][size-15+i] = get(i) ? 1 : 0;
  m[size-8][8] = 1;
}

function placeData(m, codewords){
  const size = m.length;
  const bits = [];
  codewords.forEach(b => { for (let i = 7; i >= 0; i--) bits.push((b >> i) & 1); });

  let bitIdx = 0, upward = true;
  for (let c = size - 1; c > 0; c -= 2){
    if (c === 6) c--;
    for (let i = 0; i < size; i++){
      const r = upward ? size - 1 - i : i;
      for (const cc of [c, c - 1]){
        if (m[r][cc] === null){
          const bit = bitIdx < bits.length ? bits[bitIdx++] : 0;
          m[r][cc] = bit;
        }
      }
    }
    upward = !upward;
  }
  return bitIdx;
}

function buildQR(text, eccLevel){
  const bytes = new TextEncoder().encode(text);

  // 选版本
  let version = 0;
  for (let v = 1; v <= 10; v++){
    const dataLen = CAP[v-1][1 + ECC_INDEX[eccLevel] + 1];
    const needBits = 4 + charCountBits(v,4) + bytes.length * 8;
    if (needBits <= dataLen * 8){ version = v; break; }
  }
  if (!version) throw new Error('Text too long for this build (max v10). Shorten it.');

  const codewords = buildCodewords(bytes, version, eccLevel);
  const size = version * 4 + 17;
  const m = newMatrix(size);
  placeFunctionPatterns(m, version);

  // 试 8 个掩码，选罚分最低的那个
  let bestMaskScore = Infinity;
  let result = null;
  for (let mask = 0; mask < 8; mask++){
    const mm = m.map(r => r.slice());
    placeDataInto(mm, codewords, mask);
    applyFormat(mm, eccLevel, mask);
    const score = penalty(mm);
    if (score < bestMaskScore){ bestMaskScore = score; result = mm; }
  }
  return result;
}

function placeDataInto(m, codewords, maskId){
  const bits = [];
  codewords.forEach(b => { for (let i = 7; i >= 0; i--) bits.push((b >> i) & 1); });
  const size = m.length;
  let bitIdx = 0, upward = true;
  for (let c = size - 1; c > 0; c -= 2){
    if (c === 6) c--;
    for (let i = 0; i < size; i++){
      const r = upward ? size - 1 - i : i;
      for (const cc of [c, c - 1]){
        if (m[r][cc] === null){
          let bit = bitIdx < bits.length ? bits[bitIdx++] : 0;
          if (maskFn(maskId, r, cc)) bit ^= 1;
          m[r][cc] = bit;
        }
      }
    }
    upward = !upward;
  }
}

function penalty(m){
  const size = m.length;
  let score = 0;
  // 规则1：连续同色
  for (let r = 0; r < size; r++){
    let run = 1;
    for (let c = 1; c < size; c++){
      if (m[r][c] === m[r][c-1]) run++; else { if (run >= 5) score += run - 2; run = 1; }
    }
    if (run >= 5) score += run - 2;
  }
  for (let c = 0; c < size; c++){
    let run = 1;
    for (let r = 1; r < size; r++){
      if (m[r][c] === m[r-1][c]) run++; else { if (run >= 5) score += run - 2; run = 1; }
    }
    if (run >= 5) score += run - 2;
  }
  // 规则2：2x2 同色
  for (let r = 0; r < size-1; r++)
    for (let c = 0; c < size-1; c++){
      const v = m[r][c];
      if (v === m[r][c+1] && v === m[r+1][c] && v === m[r+1][c+1]) score += 3;
    }
  return score;
}

/* ---------- 6. 渲染到 Canvas ---------- */
function renderQR(canvas, text, size, eccLevel){
  const mod = buildQR(text, eccLevel);
  const n = mod.length;
  const quiet = 4;
  const total = n + quiet * 2;
  const scale = Math.max(1, Math.floor(size / total));
  const px = total * scale;

  canvas.width = px;
  canvas.height = px;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, px, px);
  ctx.fillStyle = '#000';
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++)
      if (mod[r][c]) ctx.fillRect((c + quiet) * scale, (r + quiet) * scale, scale, scale);
}

/* ---------- 7. 页面绑定 ---------- */
(function init(){
  const $text = document.getElementById('text');
  const $size = document.getElementById('size');
  const $ecc  = document.getElementById('ecc');
  const $make = document.getElementById('make');
  const $dl   = document.getElementById('download');
  const $box  = document.getElementById('qrbox');
  if (!$text) return;

  let canvas = document.createElement('canvas');
  canvas.style.borderRadius = '10px';

  function run(){
    try{
      const px = parseInt($size.value, 10);
      renderQR(canvas, $text.value || ' ', px, $ecc.value);
      $box.innerHTML = '';
      $box.appendChild(canvas);
    }catch(e){
      // 抛出来的 message 就是 i18n 的 key，这里再翻一次
      $box.innerHTML = '<span style="color:#c00;font-size:12px;padding:12px;text-align:center">' + t(e.message) + '</span>';
    }
  }

  $size.addEventListener('input', ()=>{ document.getElementById('sizeVal').textContent = $size.value; run(); });
  $make.addEventListener('click', run);
  $text.addEventListener('input', run);
  $ecc.addEventListener('change', run);

  $dl.addEventListener('click', ()=>{
    const a = document.createElement('a');
    a.download = 'qrcode.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
  });

  run();
})();
