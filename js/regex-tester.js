/* ==========================================================================
   regex-tester.js — 正则测试
   实时高亮匹配、列出捕获组、替换预览。
   纯逻辑在上，页面绑定在下。
   ========================================================================== */

// 转义 HTML
function esc(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ---- 找出所有匹配 ----
function findMatches(pattern, flags, text){
  if (!pattern) return { ok:true, matches:[] };
  let re;
  try{
    re = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g');
  }catch(e){
    return { ok:false, error:e.message, matches:[] };
  }
  const matches = [];
  let m, guard = 0;
  while ((m = re.exec(text)) !== null){
    matches.push({
      index: m.index,
      value: m[0],
      groups: m.slice(1),
      named: m.groups ? {...m.groups} : null
    });
    if (m[0] === '') re.lastIndex++;          // 防止零宽死循环
    if (++guard > 10000) break;
  }
  return { ok:true, matches };
}

// ---- 高亮渲染 ----
function highlight(text, matches){
  if (!matches.length) return esc(text);
  let out = '';
  let pos = 0;
  matches.forEach((m, i)=>{
    out += esc(text.slice(pos, m.index));
    const cls = i % 2 ? 'hl-alt' : 'hl';
    out += `<mark class="${cls}">${esc(m.value) || '&nbsp;'}</mark>`;
    pos = m.index + m.value.length;
  });
  out += esc(text.slice(pos));
  return out;
}

// ---- 页面绑定 ----
(function init(){
  const $pattern = document.getElementById('pattern');
  const $text = document.getElementById('text');
  const $replace = document.getElementById('replace');
  const $result = document.getElementById('result');
  const $groups = document.getElementById('groups');
  const $replaced = document.getElementById('replaced');
  const $status = document.getElementById('status');
  if (!$pattern) return;

  function getFlags(){
    return ['g','i','m','s','u','y']
      .filter(f => document.getElementById('flag-' + f).checked)
      .join('');
  }

  function run(){
    const flags = getFlags();
    const r = findMatches($pattern.value, flags, $text.value);

    if (!r.ok){
      $status.textContent = 'Invalid regex: ' + r.error;
      $status.style.color = 'var(--err)';
      $result.innerHTML = '<span class="muted">—</span>';
      $groups.innerHTML = '';
      $replaced.textContent = '';
      return;
    }

    $status.textContent = r.matches.length + ' match' + (r.matches.length===1?'':'es') +
                          (flags ? ' · flags: ' + flags : '');
    $status.style.color = 'var(--ok)';

    $result.innerHTML = highlight($text.value, r.matches) || '<span class="muted">No text</span>';

    if (r.matches.length){
      $groups.innerHTML = r.matches.slice(0, 50).map((m,i)=>{
        let g = m.groups.length
          ? m.groups.map((v,j)=>`<span class="muted">$${j+1}</span> ${v===undefined?'<i>undefined</i>':esc(v)}`).join(' &nbsp;·&nbsp; ')
          : '<span class="muted">no groups</span>';
        return `<div class="kv"><span>#${i+1} @${m.index}</span><span style="text-align:right">${g}</span></div>`;
      }).join('') + (r.matches.length > 50 ? `<div class="hint">…and ${r.matches.length-50} more</div>` : '');
    } else {
      $groups.innerHTML = '<span class="muted">No matches</span>';
    }

    // 替换预览
    if ($replace.value && r.matches.length){
      try{
        const re = new RegExp($pattern.value, flags.includes('g')?flags:flags+'g');
        $replaced.textContent = $text.value.replace(re, $replace.value);
      }catch(e){ $replaced.textContent = ''; }
    } else {
      $replaced.textContent = '';
    }
  }

  $pattern.addEventListener('input', run);
  $text.addEventListener('input', run);
  $replace.addEventListener('input', run);
  document.querySelectorAll('[id^="flag-"]').forEach(el => el.addEventListener('change', run));

  // 常用正则速填
  document.querySelectorAll('[data-preset]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const [pat, fl, hint] = btn.dataset.preset.split('|');
      $pattern.value = pat;
      ['g','i','m','s','u','y'].forEach(f => document.getElementById('flag-'+f).checked = fl.includes(f));
      run();
    });
  });

  // 默认填点内容
  if (!$text.value) $text.value = 'Contact: alice@example.com, bob@test.org\nPhone: 138-0000-1111\nDate: 2026-10-08';
  if (!$pattern.value) $pattern.value = '[\\w.]+@[\\w.]+\\.\\w+';
  run();
})();
