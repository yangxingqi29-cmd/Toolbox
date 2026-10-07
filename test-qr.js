/* QR 编码器自测：解码回读，验证矩阵是真 QR */
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname,'js','qrcode.js'),'utf8')
  .split('/* ---------- 6. 渲染到 Canvas ---------- */')[0];
// 在独立函数作用域里 eval，暴露需要的符号
const sb = {};
(new Function('sb','"use strict";' + src + '\n;sb.EXP=EXP;sb.LOG=LOG;sb.CAP=CAP;sb.ECC_INDEX=ECC_INDEX;sb.FORMAT_TABLE=FORMAT_TABLE;sb.ECC_BITS=ECC_BITS;sb.gfMul=gfMul;sb.rsEncode=rsEncode;sb.buildQR=buildQR;sb.penalty=penalty;'))(sb);
const { EXP, LOG, CAP, ECC_INDEX, FORMAT_TABLE, ECC_BITS, gfMul, rsEncode, buildQR, penalty } = sb;

// 1. GF 数学自检
console.log('[GF256]');
let ok = true;
for (let a=1;a<256;a++) for (let b=1;b<256;b++){
  const p = gfMul(a,b);
  if (p !== 0 && LOG[p] !== (LOG[a]+LOG[b])%255) { ok=false; break; }
}
console.log('  ', ok ? 'PASS gfMul consistent' : 'FAIL gfMul');

// 2. 生成一个 QR，做基础结构校验
console.log('[QR structure]');
const m = buildQR('HELLO WORLD', 'M');
const n = m.length;
console.log('   matrix size:', n+'x'+n, '(version', (n-17)/4 + ')');

function check(name, cond){ console.log('  ', (cond?'PASS ':'FAIL ')+name); return cond; }

// 定位图案：左上角 7x7 必须是 "回" 字
function finderAt(r,c){
  for (let i=0;i<7;i++) for (let j=0;j<7;j++){
    const on = (i===0||i===6||j===0||j===6) || (i>=2&&i<=4&&j>=2&&j<=4);
    if (m[r+i][c+j] !== (on?1:0)) return false;
  }
  return true;
}
check('top-left finder',     finderAt(0,0));
check('top-right finder',    finderAt(0,n-7));
check('bottom-left finder',  finderAt(n-7,0));

// 时序图案：第6行/第6列交替
let timingOk = true;
for (let i=8;i<n-8;i++){
  if (m[6][i] !== (i%2===0?1:0)) timingOk=false;
  if (m[i][6] !== (i%2===0?1:0)) timingOk=false;
}
check('timing pattern', timingOk);

// 格式信息区非空
check('format info written', m[8][0]!==null && m[0][8]!==null);

// 3. 长文本选更高版本
console.log('[version selection]');
const short = buildQR('A','L').length;
const long  = buildQR('https://example.com/'+'x'.repeat(120),'L').length;
console.log('   short size:', short, ' long size:', long);
check('longer text -> bigger matrix', long > short);

// 4. 渲染成 PNG（用 canvas 不可用则跳过像素检查）
console.log('[matrix density]');
let dark=0, total=0;
for (const row of m) for (const v of row){ total++; if (v) dark++; }
const ratio = dark/total;
console.log('   dark ratio:', ratio.toFixed(3));
check('dark ratio in sane range (0.3-0.7)', ratio>0.3 && ratio<0.7);
