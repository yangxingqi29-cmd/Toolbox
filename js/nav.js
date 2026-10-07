/* ==========================================================================
   nav.js — 全站导航 + 语言切换
   依赖 i18n.js（必须先加载）。
   工具名和分组名走 t()，加新工具只改 GROUPS 一处。
   ========================================================================== */
(function(){

  const inTools = location.pathname.indexOf('/tools/') >= 0;
  const base = inTools ? '../' : '';

  const GROUPS = [
    ['Converters', [
      ['unit-converter.html',     'Unit Converter'],
      ['currency-converter.html', 'Currency Converter'],
      ['timestamp.html',          'Timestamp Converter'],
      ['color-converter.html',    'Color Converter'],
      ['case-converter.html',     'Case Converter']
    ]],
    ['Generators', [
      ['password-generator.html', 'Password Generator'],
      ['uuid.html',               'UUID Generator'],
      ['qr-generator.html',       'QR Code Generator']
    ]],
    ['Text & Code', [
      ['json-formatter.html',     'JSON Formatter'],
      ['base64.html',             'Base64 Encoder'],
      ['regex-tester.html',       'Regex Tester'],
      ['word-counter.html',       'Word Counter']
    ]],
    ['Files & Media', [
      ['image-compressor.html',   'Image Compressor'],
      ['pdf-tools.html',          'PDF Merge / Split']
    ]],
    ['Calculators', [
      ['mortgage.html',           'Mortgage Calculator'],
      ['date-calculator.html',    'Date Calculator']
    ]]
  ];

  function render(){
    const nav = document.getElementById('nav');
    if (!nav) return;

    let html = '<a href="' + base + 'index.html">' + t('Home') + '</a>';

    html += '<span class="nav-dd"><a>' + t('Tools') + ' &#9662;</a><span class="menu">';
    for (const [group, items] of GROUPS){
      html += '<span class="menu-h">' + t(group) + '</span>';
      for (const [file, label] of items){
        html += '<a href="' + base + 'tools/' + file + '">' + t(label) + '</a>';
      }
    }
    html += '</span></span>';

    const lang = i18nLang();
    html += '<span class="nav-dd nav-lang"><a title="' + t('Language') + '">' +
            I18N_SHORT[lang] + ' &#9662;</a><span class="menu">';
    for (const code of I18N_LANGS){
      html += '<a href="#" data-lang="' + code + '"' + (code === lang ? ' class="on"' : '') + '>' +
              I18N_LABELS[code] + '</a>';
    }
    html += '</span></span>';

    nav.innerHTML = html;

    nav.querySelectorAll('[data-lang]').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        setLang(a.getAttribute('data-lang'));
      });
    });
  }

  render();
  document.addEventListener('i18n:changed', render);
})();
