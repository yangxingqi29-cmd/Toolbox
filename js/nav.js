/* ==========================================================================
   nav.js — 全站导航注入
   工具多了以后导航不能每页手写，这里统一渲染。
   自动判断当前在 /tools/ 还是根目录，拼相对路径。
   新增工具 = 在 GROUPS 里加一行，全站导航同步更新。
   ========================================================================== */
(function(){
  const inTools = location.pathname.includes('/tools/');
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

  const nav = document.getElementById('nav');
  if (!nav) return;

  let html = `<a href="${base}index.html">Home</a>`;
  html += `<span class="nav-dd"><a>Tools &#9662;</a><span class="menu">`;
  for (const [group, items] of GROUPS){
    html += `<span class="menu-h">${group}</span>`;
    for (const [file, label] of items){
      html += `<a href="${base}tools/${file}">${label}</a>`;
    }
  }
  html += `</span></span>`;

  nav.innerHTML = html;
})();
