/* ==========================================================================
   word-counter.js — 字数 / 字符统计
   支持英文按空格分词，中文按字计数。
   ========================================================================== */

const STOPWORDS = new Set(['the','a','an','and','or','but','if','of','to','in','on','at','for','with','is','are','was','were','be','been','it','this','that','as','by','from','not','you','your','we','our','they','their','he','she','his','her','i','me','my']);

function analyze(text){
  const chars       = text.length;
  const charsNoSpace= text.replace(/\s/g,'').length;
  const letters     = (text.match(/[A-Za-z]/g) || []).length;
  const digits      = (text.match(/\d/g) || []).length;
  const spaces      = (text.match(/\s/g) || []).length;

  // 英文单词（含连字符/撇号）
  const words = text.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g) || [];
  // 中文字符
  const cjk = text.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || [];

  const sentences = (text.match(/[^.!?。！？…]+[.!?。！？…]+/g) || []).length
                    || (text.trim() ? 1 : 0);
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim()).length
                     || (text.trim() ? 1 : 0);
  const lines = text ? text.split('\n').length : 0;

  const wordCount = words.length + cjk.length;
  const readingMin = wordCount / 225;          // 英文 225 wpm
  const speakingMin = wordCount / 130;

  return {
    chars, charsNoSpace, letters, digits, spaces,
    words: words.length, cjk: cjk.length, wordCount,
    sentences, paragraphs, lines,
    readingMin, speakingMin
  };
}

function topWords(text, n){
  const words = (text.toLowerCase().match(/[a-z0-9]+(?:['’-][a-z0-9]+)*/g) || [])
    .filter(w => w.length > 2 && !STOPWORDS.has(w));
  const freq = {};
  words.forEach(w => freq[w] = (freq[w] || 0) + 1);
  return Object.entries(freq).sort((a,b) => b[1]-a[1] || a[0].localeCompare(b[0])).slice(0, n||10);
}

function fmtTime(min){
  if (min < 1) return Math.round(min*60) + ' sec';
  return min.toFixed(1) + ' min';
}

// ---- 页面绑定 ----
(function init(){
  const $in = document.getElementById('input');
  const $stats = document.getElementById('stats');
  const $top = document.getElementById('topwords');
  const $clear = document.getElementById('clear');
  const $copy = document.getElementById('copy');
  if (!$in) return;

  function render(){
    const t = $in.value;
    const s = analyze(t);
    $stats.innerHTML = `
      <div class="kv"><span>Words</span><span>${s.wordCount.toLocaleString()}</span></div>
      <div class="kv"><span>Characters</span><span>${s.chars.toLocaleString()}</span></div>
      <div class="kv"><span>Characters (no spaces)</span><span>${s.charsNoSpace.toLocaleString()}</span></div>
      <div class="kv"><span>Letters</span><span>${s.letters.toLocaleString()}</span></div>
      <div class="kv"><span>Digits</span><span>${s.digits.toLocaleString()}</span></div>
      <div class="kv"><span>Sentences</span><span>${s.sentences.toLocaleString()}</span></div>
      <div class="kv"><span>Paragraphs</span><span>${s.paragraphs.toLocaleString()}</span></div>
      <div class="kv"><span>Lines</span><span>${s.lines.toLocaleString()}</span></div>
      <div class="kv"><span>Reading time</span><span>${fmtTime(s.readingMin)}</span></div>
      <div class="kv"><span>Speaking time</span><span>${fmtTime(s.speakingMin)}</span></div>`;

    const top = topWords(t, 10);
    $top.innerHTML = top.length
      ? top.map(([w,c]) => `<div class="kv"><span>${w}</span><span>${c}</span></div>`).join('')
      : '<span class="muted">No repeated words yet</span>';
  }

  $in.addEventListener('input', render);
  $clear.addEventListener('click', ()=>{ $in.value=''; render(); $in.focus(); });
  $copy.addEventListener('click', ()=>{
    const s = analyze($in.value);
    const txt = `Words: ${s.wordCount}\nCharacters: ${s.chars}\nCharacters (no spaces): ${s.charsNoSpace}\nSentences: ${s.sentences}\nParagraphs: ${s.paragraphs}`;
    navigator.clipboard.writeText(txt).then(()=>{
      $copy.textContent='Copied!'; setTimeout(()=>$copy.textContent='Copy stats',1200);
    });
  });

  render();
})();
