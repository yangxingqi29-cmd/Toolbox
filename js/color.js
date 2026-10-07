/* ==========================================================================
   color.js — 颜色格式转换 HEX / RGB / HSL
   三个输入框互相同步：改哪个都能解析并刷新另外两个 + 色块。
   ========================================================================== */

function clamp(n, lo, hi){ return Math.max(lo, Math.min(hi, n)); }

// ---- 解析 ----
function parseHex(s){
  s = s.trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(s)) s = s.split('').map(c=>c+c).join('');
  if (!/^[0-9a-f]{6}$/i.test(s)) return null;
  return { r: parseInt(s.slice(0,2),16), g: parseInt(s.slice(2,4),16), b: parseInt(s.slice(4,6),16) };
}
function parseRgb(s){
  const m = s.match(/(\d{1,3})\D+(\d{1,3})\D+(\d{1,3})/);
  if (!m) return null;
  return { r: clamp(+m[1],0,255), g: clamp(+m[2],0,255), b: clamp(+m[3],0,255) };
}
function parseHsl(s){
  const m = s.match(/([\d.]+)\D+([\d.]+)%?\D+([\d.]+)%?/);
  if (!m) return null;
  const rgb = hslToRgb(+m[1], +m[2], +m[3]);
  return rgb;
}

// ---- 转换 ----
function rgbToHex({r,g,b}){
  return '#' + [r,g,b].map(v=>clamp(Math.round(v),0,255).toString(16).padStart(2,'0')).join('');
}
function rgbToHsl({r,g,b}){
  r/=255; g/=255; b/=255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h = 0, s = 0, l = (max + min) / 2;
  const d = max - min;
  if (d !== 0){
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return { h: Math.round(h), s: Math.round(s*100), l: Math.round(l*100) };
}
function hslToRgb(h,s,l){
  h = ((h % 360) + 360) % 360; s = clamp(s,0,100)/100; l = clamp(l,0,100)/100;
  const c = (1 - Math.abs(2*l - 1)) * s;
  const x = c * (1 - Math.abs((h/60) % 2 - 1));
  const m = l - c/2;
  let r=0,g=0,b=0;
  if (h < 60)       [r,g,b]=[c,x,0];
  else if (h < 120) [r,g,b]=[x,c,0];
  else if (h < 180) [r,g,b]=[0,c,x];
  else if (h < 240) [r,g,b]=[0,x,c];
  else if (h < 300) [r,g,b]=[x,0,c];
  else              [r,g,b]=[c,0,x];
  return { r: Math.round((r+m)*255), g: Math.round((g+m)*255), b: Math.round((b+m)*255) };
}

// ---- 页面绑定 ----
(function init(){
  const $picker = document.getElementById('picker');
  const $swatch = document.getElementById('swatch');
  const $hex = document.getElementById('hex');
  const $rgb = document.getElementById('rgb');
  const $hsl = document.getElementById('hsl');
  if (!$hex) return;

  let syncing = false;

  function paint(rgb){
    $swatch.style.background = rgbToHex(rgb);
    $picker.value = rgbToHex(rgb);
  }
  function updateFrom(rgb, source){
    if (syncing) return;
    syncing = true;
    const hex = rgbToHex(rgb);
    const hsl = rgbToHsl(rgb);
    if (source !== 'hex') $hex.value = hex;
    if (source !== 'rgb') $rgb.value = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    if (source !== 'hsl') $hsl.value = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
    paint(rgb);
    syncing = false;
  }

  $hex.addEventListener('input', ()=>{ const c = parseHex($hex.value); if (c) updateFrom(c,'hex'); });
  $rgb.addEventListener('input', ()=>{ const c = parseRgb($rgb.value); if (c) updateFrom(c,'rgb'); });
  $hsl.addEventListener('input', ()=>{ const c = parseHsl($hsl.value); if (c) updateFrom(c,'hsl'); });
  $picker.addEventListener('input', ()=>{ const c = parseHex($picker.value); if (c) updateFrom(c,'picker'); });

  document.querySelectorAll('[data-copy]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const which = btn.dataset.copy;
      const map = { hex: $hex, rgb: $rgb, hsl: $hsl };
      navigator.clipboard.writeText(map[which].value).then(()=>{
        const old = btn.textContent;
        btn.textContent = t('Copied!');
        setTimeout(()=>btn.textContent = old, 1000);
      });
    });
  });

  document.getElementById('random').addEventListener('click', ()=>{
    const rgb = { r: Math.floor(Math.random()*256), g: Math.floor(Math.random()*256), b: Math.floor(Math.random()*256) };
    updateFrom(rgb, 'random');
  });
})();
