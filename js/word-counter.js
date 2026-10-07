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
  if (min < 1) return t('{n} sec', { n: Math.round(min*60) });
  return t('{n} min', { n: min.toFixed(1) });
}

// ---- 页面绑定 ----
(function init(){
  const $in = document.getElementById('input');
  const $stats = document.getElementById('stats');
  const $top = document.getElementById('topwords');
  const $clear = document.getElementById('clear');
  const $copy = document.getElementById('copy');
  if (!$in) return;

  // 注意：这里不能把局部变量叫 t，会盖住 i18n 的 t()
  const row = (label, value) =>
    `<div class="kv"><span>${t(label)}</span><span>${value}</span></div>`;
  const num = n => n.toLocaleString(i18nLocale());

  function render(){
    const text = $in.value;
    const s = analyze(text);
    $stats.innerHTML =
      row('Words', num(s.wordCount)) +
      row('Characters', num(s.chars)) +
      row('Characters (no spaces)', num(s.charsNoSpace)) +
      row('Letters', num(s.letters)) +
      row('Digits', num(s.digits)) +
      row('Sentences', num(s.sentences)) +
      row('Paragraphs', num(s.paragraphs)) +
      row('Lines', num(s.lines)) +
      row('Reading time', fmtTime(s.readingMin)) +
      row('Speaking time', fmtTime(s.speakingMin));

    const top = topWords(text, 10);
    $top.innerHTML = top.length
      ? top.map(([w,c]) => `<div class="kv"><span>${w}</span><span>${num(c)}</span></div>`).join('')
      : '<span class="muted">' + t('No repeated words yet') + '</span>';
  }

  $in.addEventListener('input', render);
  $clear.addEventListener('click', ()=>{ $in.value=''; render(); $in.focus(); });
  $copy.addEventListener('click', ()=>{
    const s = analyze($in.value);
    const txt = t('Words: {w}\nCharacters: {c}\nCharacters (no spaces): {cs}\nSentences: {s}\nParagraphs: {p}',
                  { w: s.wordCount, c: s.chars, cs: s.charsNoSpace, s: s.sentences, p: s.paragraphs });
    navigator.clipboard.writeText(txt).then(()=>{
      $copy.textContent = t('Copied!');
      setTimeout(()=>$copy.textContent = t('Copy stats'), 1200);
    });
  });

  render();
})();
