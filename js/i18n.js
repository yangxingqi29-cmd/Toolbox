/* ==========================================================================
   i18n.js — 全站多语言（English / 中文 / Español / Русский）

   设计要点
   --------
   1. 以「英文原文」作为 key。HTML 里写 <h1 data-i18n="Unit Converter">Unit Converter</h1>，
      查表就是查这句英文本身。不需要给几百条文案起名字，漏翻也能优雅回退到英文。
   2. 静态文案：applyI18n() 扫 [data-i18n] / [data-i18n-ph] / [data-i18n-content] 替换。
   3. 动态文案（JS 里拼的）：直接调 t('...')，占位符写 {n}。
   4. 语言来源优先级：URL ?lang= > localStorage > 浏览器语言 > en。
   5. 切换语言整页重载 —— 保证每个工具的初始渲染都在新语言下重新跑一遍，
      不需要给 16 个脚本都挂事件监听。
   6. 数字/日期/货币名交给 Intl，不占词典：
      · 货币全名  → Intl.DisplayNames
      · 相对时间  → Intl.RelativeTimeFormat（俄语的 1 год / 2 года / 5 лет 自动正确）
      · 数字分组  → Intl.NumberFormat

   单位名单独用紧凑数组存（见 I18N.xx.units），顺序与 js/units.js 的 UNITS 表一致，
   这样 60 条单位名只占 8 行，不用写成 60 条扁平 key。
   ========================================================================== */

const I18N_LANGS   = ['en', 'zh', 'es', 'ru'];
const I18N_LABELS  = { en: 'English', zh: '中文', es: 'Español', ru: 'Русский' };
const I18N_SHORT   = { en: 'EN',      zh: '中文', es: 'ES',      ru: 'RU' };
const I18N_LOCALES = { en: 'en-US',   zh: 'zh-CN', es: 'es-ES',  ru: 'ru-RU' };
const I18N_STORE   = 'toolbox.lang';
const I18N_DEFAULT = 'en';

/* ==========================================================================
   词典
   ========================================================================== */

const I18N = { en: {} };

/* ------------------------------- 中文 ------------------------------- */
I18N.zh = {

  /* ---- 外壳 ---- */
  'Home': '首页',
  'Privacy': '隐私',
  'Privacy Policy': '隐私政策',
  'Tools': '工具',
  'Language': '语言',
  'Converters': '换算',
  'Generators': '生成器',
  'Text & Code': '文本与代码',
  'Files & Media': '文件与媒体',
  'Calculators': '计算器',

  /* ---- 导航工具名 ---- */
  'Unit Converter': '单位换算',
  'Currency Converter': '汇率换算',
  'Timestamp Converter': '时间戳转换',
  'Color Converter': '颜色转换',
  'Case Converter': '大小写转换',
  'Password Generator': '密码生成器',
  'UUID Generator': 'UUID 生成器',
  'QR Code Generator': '二维码生成器',
  'JSON Formatter': 'JSON 格式化',
  'Base64 Encoder': 'Base64 编解码',
  'Regex Tester': '正则测试',
  'Word Counter': '字数统计',
  'Image Compressor': '图片压缩',
  'PDF Merge / Split': 'PDF 合并 / 拆分',
  'Mortgage Calculator': '房贷计算器',
  'Date Calculator': '日期计算器',

  /* ---- 广告位 ---- */
  'Ad slot — 728x90 / responsive': '广告位 — 728x90 / 自适应',
  'Ad slot — 300x250': '广告位 — 300x250',

  /* ---- 页脚 ---- */
  '© 2026 Toolbox. All tools run locally in your browser.': '© 2026 Toolbox。所有工具都在你的浏览器里本地运行。',
  '© 2026 Toolbox. Estimates only — not financial advice.': '© 2026 Toolbox。结果仅供参考，不构成理财建议。',
  '© 2026 Toolbox. Generated locally with Web Crypto.': '© 2026 Toolbox。使用 Web Crypto 在本地生成。',
  '© 2026 Toolbox. Generated with Web Crypto.': '© 2026 Toolbox。由 Web Crypto 生成。',
  '© 2026 Toolbox. Images never leave your browser.': '© 2026 Toolbox。图片不会离开你的浏览器。',
  '© 2026 Toolbox. Powered by pdf-lib, running locally.': '© 2026 Toolbox。基于 pdf-lib，本地运行。',
  '© 2026 Toolbox. QR encoding uses a compact built-in renderer.': '© 2026 Toolbox。二维码编码使用内置的轻量编码器。',
  '© 2026 Toolbox. Rates from open exchange-rate API.': '© 2026 Toolbox。汇率来自公开汇率接口。',

  /* ---- 首页 ---- */
  'Free tools that just work': '真正好用的免费工具',
  'Fast, private, browser-based utilities. No signup, no upload — everything runs on your device.':
    '快速、私密、全部在浏览器里运行。无需注册、无需上传 —— 一切都在你的设备上完成。',
  'Length, weight, temperature, area, volume, speed, time and data storage.':
    '长度、重量、温度、面积、体积、速度、时间和数据存储。',
  'Convert between 30+ currencies with live exchange rates.': '30 多种货币之间按实时汇率换算。',
  'Unix epoch ↔ date, in seconds or milliseconds, local and UTC.': 'Unix 时间戳 ↔ 日期，支持秒/毫秒、本地时间和 UTC。',
  'UPPER, lower, Title, camelCase, snake_case, kebab-case and more.': '大写、小写、标题式、camelCase、snake_case、kebab-case 等。',
  'HEX ↔ RGB ↔ HSL. Pick and preview colors instantly.': 'HEX ↔ RGB ↔ HSL，取色并即时预览。',
  'Strong random passwords with a strength meter. Never leaves your browser.': '带强度计的强随机密码，绝不离开你的浏览器。',
  'Random UUID v4 values in bulk, with uppercase and no-dash options.': '批量生成随机 UUID v4，支持大写和去横线。',
  'Turn any text or URL into a downloadable QR code image.': '把任意文本或网址变成可下载的二维码图片。',
  'Pretty-print, minify, sort keys and validate JSON with line numbers.': '美化、压缩、键排序、校验 JSON，报错带行号。',
  'Encode or decode text and files. URL-safe variant and Data URI output.': '文本和文件的编解码，支持 URL 安全变体和 Data URI。',
  'Live match highlighting, capture groups and replace preview.': '实时高亮匹配、捕获组和替换预览。',
  'Words, characters, sentences, reading time and top words.': '词数、字符数、句子数、阅读时长和高频词。',
  'Shrink and resize JPG, PNG and WebP without uploading.': '压缩和缩放 JPG、PNG、WebP，无需上传。',
  'Combine several PDFs or extract a page range into a new file.': '合并多个 PDF，或把页码范围导出成新文件。',
  'Monthly payment, total interest and a year-by-year amortization table.': '月供、总利息，以及逐年还款计划表。',
  'Days between dates, date arithmetic and exact age.': '日期间隔天数、日期加减和精确年龄。',
  'Why Toolbox': '为什么用 Toolbox',
  'Every tool runs entirely in your browser with plain JavaScript — nothing is sent to a server. That means it loads instantly, works offline, and keeps your data private. Bookmark any tool and use it any time.':
    '每个工具都用纯 JavaScript 在你的浏览器里跑完 —— 没有任何数据发往服务器。所以它加载飞快、可离线使用，你的数据也始终私密。把工具加进书签，随时可用。',

  /* ---- 隐私政策 ---- */
  'Last updated: October 7, 2026': '最后更新：2026 年 10 月 7 日',
  '1. What we collect': '1. 我们收集什么',
  '2. Files you open': '2. 你打开的文件',
  '3. Cookies and third-party advertising': '3. Cookie 与第三方广告',
  '4. Server logs': '4. 服务器日志',
  '5. Children': '5. 未成年人',
  '6. Your rights': '6. 你的权利',
  '7. Changes': '7. 变更',
  '8. Contact': '8. 联系方式',
  'Nothing. Toolbox has no accounts, no sign-up and no server-side storage. Every tool on this site is a plain HTML/CSS/JavaScript page that executes entirely inside your browser. The text you type, the files you pick and the values you calculate are processed on your device and are never transmitted to us.':
    '什么都没有。Toolbox 没有账号、没有注册、没有服务端存储。本站每个工具都是一个普通的 HTML/CSS/JavaScript 页面，完全在你的浏览器内执行。你输入的文本、选择的文件、计算出的数值都在你的设备上处理，绝不会传给我们。',
  'Tools such as the Image Compressor, PDF Merge / Split and Base64 Encoder read files through the browser\'s local File API. Those files stay in your browser\'s memory. They are not uploaded, and closing the tab discards them.':
    '图片压缩、PDF 合并/拆分、Base64 编解码等工具通过浏览器的本地 File API 读取文件。这些文件只停留在浏览器内存中，不会被上传，关闭标签页即被丢弃。',
  'We do not set cookies for our own purposes. This site is supported by advertising, and the advertising partners we work with may set cookies or read device identifiers in order to serve and measure ads.':
    '我们不会为自己的目的设置 Cookie。本站靠广告维持运营，我们合作的广告伙伴可能会设置 Cookie 或读取设备标识符，用于投放和衡量广告。',
  'Third-party vendors, including Google, may use cookies to serve ads based on your prior visits to this site or to other sites. Google\'s use of advertising cookies enables it and its partners to serve ads to you based on your visit to this site and/or other sites on the internet.':
    '包括 Google 在内的第三方供应商可能会使用 Cookie，根据你此前对本站或其他网站的访问记录投放广告。Google 使用广告 Cookie，使其自身及其合作伙伴能够根据你访问本站和/或互联网上其他网站的情况向你投放广告。',
  'You can opt out of personalised advertising by visiting': '你可以访问以下页面来关闭个性化广告：',
  'Google Ads Settings': 'Google 广告设置',
  ', or opt out of third-party vendor cookies for personalised advertising at':
    '，或在以下地址关闭第三方供应商的个性化广告 Cookie：',
  '. If you are in the European Economic Area, the United Kingdom or Switzerland, you will be asked for consent before any personalised advertising cookie is set, and you may withdraw that consent at any time.':
    '。如果你位于欧洲经济区、英国或瑞士，在设置任何个性化广告 Cookie 之前我们会先征得你的同意，你也可以随时撤回该同意。',
  'Like any website, our hosting provider may record standard request logs — IP address, user agent, requested path and timestamp — for security and abuse prevention. These logs are not linked to any information you enter into a tool.':
    '和任何网站一样，我们的托管服务商可能会记录标准的请求日志 —— IP 地址、User Agent、请求路径和时间戳 —— 用于安全和防止滥用。这些日志不会与你输入到工具中的任何信息关联。',
  'This site is not directed at children under 13, and we do not knowingly collect personal information from them.':
    '本站不面向 13 岁以下儿童，我们也不会在知情的情况下收集他们的个人信息。',
  'Because we hold no personal data about you, there is nothing for us to export, correct or delete. Requests concerning advertising data should be directed to the relevant ad vendor using the opt-out links in section 3.':
    '由于我们不持有你的任何个人数据，因此没有可供导出、更正或删除的内容。与广告数据相关的请求，请通过第 3 节的退出链接直接联系相应的广告供应商。',
  'If this policy changes, the revised version will be posted on this page with an updated date.':
    '如果本政策发生变化，修订版本会连同新的日期发布在本页面。',
  'Questions about this policy:': '关于本政策的疑问请联系：',

  /* ---- 单位换算 ---- */
  'Convert between common units of length, weight, temperature, area, volume and speed.':
    '在常用的长度、重量、温度、面积、体积和速度单位之间换算。',
  'Category': '类别',
  'Value': '数值',
  'From': '从',
  'To': '到',
  '⇆ Swap units': '⇆ 交换单位',
  'Copy result': '复制结果',
  'Length': '长度',
  'Weight / Mass': '重量 / 质量',
  'Temperature': '温度',
  'Area': '面积',
  'Volume': '体积',
  'Speed': '速度',
  'Time': '时间',
  'Digital Storage': '数据存储',

  /* ---- 汇率换算 ---- */
  'Convert between 30+ currencies using live exchange rates.': '使用实时汇率在 30 多种货币之间换算。',
  'Amount': '金额',
  '⇆ Swap': '⇆ 交换',
  'Refresh rates': '刷新汇率',
  'Popular conversions': '常见换算',
  'Fetching live rates…': '正在获取实时汇率…',
  'Refreshing…': '正在刷新…',
  'Live rates · updated {t}': '实时汇率 · 更新于 {t}',
  'Offline — using built-in fallback rates': '离线 —— 使用内置备用汇率',
  '1 {a} = {b} {c} · live rates': '1 {a} = {b} {c} · 实时汇率',

  /* ---- 时间戳 ---- */
  'Unix Timestamp Converter': 'Unix 时间戳转换',
  'Unix Timestamp Converter — Epoch to Date': 'Unix 时间戳转换 — 时间戳与日期互转',
  'Paste a timestamp to get a date, or pick a date to get its timestamp. Seconds and milliseconds auto-detected.':
    '粘贴时间戳得到日期，或选择日期得到时间戳。自动识别秒和毫秒。',
  'Unix timestamp': 'Unix 时间戳',
  'Date & time (local)': '日期与时间（本地）',
  'Timestamp → Date': '时间戳 → 日期',
  'Date → Timestamp': '日期 → 时间戳',
  'Use current time': '使用当前时间',
  'Detected': '识别为',
  'seconds': '秒',
  'milliseconds': '毫秒',
  'Local': '本地时间',
  'UTC': 'UTC',
  'ISO 8601': 'ISO 8601',
  'RFC 2822': 'RFC 2822',
  'Relative': '相对时间',
  'Seconds': '秒',
  'Milliseconds': '毫秒',
  'Invalid date': '无效日期',
  'Enter a valid number': '请输入有效数字',
  'just now': '刚刚',
  'Clear': '清空',

  /* ---- 颜色转换 ---- */
  'Color Converter — HEX, RGB, HSL': '颜色转换 — HEX、RGB、HSL',
  'Convert HEX ↔ RGB ↔ HSL with a live preview. Pick a color or type a value.':
    '在 HEX ↔ RGB ↔ HSL 之间转换并实时预览。取色或直接输入数值。',
  'HEX': 'HEX',
  'RGB': 'RGB',
  'HSL': 'HSL',
  'Hex color': 'HEX 颜色',
  'Pick a color': '选择颜色',
  'Random color': '随机颜色',
  'Copy HEX': '复制 HEX',
  'Copy RGB': '复制 RGB',
  'Copy HSL': '复制 HSL',

  /* ---- 大小写转换 ---- */
  'Case Converter — UPPER, lower, camelCase, snake_case': '大小写转换 — 大写、小写、camelCase、snake_case',
  'Type once, get every naming style at the same time — including camelCase and snake_case for code.':
    '输入一次，同时得到所有命名风格 —— 包括写代码用的 camelCase 和 snake_case。',
  'Title Case': '标题式 Title Case',
  'Sentence case': '句首大写 Sentence case',

  /* ---- 密码生成 ---- */
  'Password Generator — Strong Random Passwords': '密码生成器 — 强随机密码',
  'Generate strong passwords with a cryptographically secure random source. Nothing is sent anywhere.':
    '用密码学安全的随机源生成强密码。不会有任何数据被发送出去。',
  'Generated password': '生成的密码',
  'Length:': '长度：',
  'Uppercase (A-Z)': '大写字母 (A-Z)',
  'Lowercase (a-z)': '小写字母 (a-z)',
  'Numbers (0-9)': '数字 (0-9)',
  'Symbols (!@#$…)': '符号 (!@#$…)',
  'Avoid ambiguous (0 O o 1 l I |)': '排除易混淆字符 (0 O o 1 l I |)',
  'Quick presets': '快捷预设',
  '↻ Generate': '↻ 生成',
  'Weak': '弱',
  'Fair': '一般',
  'Strong': '强',
  'Very strong': '非常强',
  '{label} · ~{bits} bits of entropy': '{label} · 约 {bits} 位熵',

  /* ---- UUID ---- */
  'UUID Generator — Random v4 UUIDs': 'UUID 生成器 — 随机 v4 UUID',
  'Generate cryptographically random UUID v4 values, one at a time or in bulk.':
    '生成密码学随机的 UUID v4，单个或批量均可。',
  'How many': '生成数量',
  'Uppercase': '大写',
  'No dashes': '去掉横线',
  'Braces {}': '花括号 {}',
  'Copy all': '全部复制',
  'Download .txt': '下载 .txt',

  /* ---- 二维码 ---- */
  'QR Code Generator — Text & URL to QR': '二维码生成器 — 文本和网址转二维码',
  'Type any text or URL and download it as a QR code image. Everything happens in your browser.':
    '输入任意文本或网址，下载为二维码图片。全部在你的浏览器里完成。',
  'Text or URL': '文本或网址',
  'Size:': '尺寸：',
  'Error correction': '纠错等级',
  'QR preview': '二维码预览',
  'Download PNG': '下载 PNG',
  'L — 7%': 'L — 7%',
  'M — 15%': 'M — 15%',
  'Q — 25%': 'Q — 25%',
  'H — 30%': 'H — 30%',
  'Text too long for this build (max v10). Shorten it.': '文本太长，超出本版本上限（最高 v10）。请缩短。',

  /* ---- JSON ---- */
  'JSON Formatter & Validator': 'JSON 格式化与校验',
  'JSON Formatter & Validator — Pretty Print, Minify': 'JSON 格式化与校验 — 美化、压缩',
  'Pretty-print, minify and validate JSON. Errors are reported with line and column.':
    '美化、压缩、校验 JSON。报错会给出具体行列号。',
  'JSON input': 'JSON 输入',
  'Indent': '缩进',
  'Sort keys alphabetically': '按键名排序',
  'Format': '格式化',
  'Minify': '压缩',
  '1 space': '1 个空格',
  '2 spaces': '2 个空格',
  '4 spaces': '4 个空格',
  'Tab-less (compact)': '无缩进（紧凑）',
  'Invalid JSON': '无效 JSON',
  '(line {l}, col {c})': '（第 {l} 行，第 {c} 列）',
  'Valid JSON · {k} keys · depth {d} · {b} bytes': '有效 JSON · {k} 个键 · 深度 {d} · {b} 字节',
  'Unexpected end of input — expected a value': '输入意外结束 —— 此处需要一个值',
  'Unexpected end of input — the array is not closed': '输入意外结束 —— 数组没有闭合',
  'Unexpected end of input — the object is not closed': '输入意外结束 —— 对象没有闭合',
  'Unexpected end of input — expected \':\'': '输入意外结束 —— 缺少 \':\'',
  'Unexpected token \'{c}\' — expected a value': '意外的字符 \'{c}\' —— 此处需要一个值',
  'Unexpected token \'{c}\' after the JSON value': 'JSON 值之后出现意外字符 \'{c}\'',
  'Expected \',\' or \']\' but found \'{c}\'': '应为 \',\' 或 \']\'，实际是 \'{c}\'',
  'Expected \',\' or \'}\' but found \'{c}\'': '应为 \',\' 或 \'}\'，实际是 \'{c}\'',
  'Expected a double-quoted property name but found \'{c}\'': '属性名必须是双引号字符串，实际是 \'{c}\'',
  'Expected \':\' after the property name but found \'{c}\'': '属性名后应为 \':\'，实际是 \'{c}\'',
  'Trailing comma is not allowed in JSON': 'JSON 不允许尾随逗号',
  'Unterminated string': '字符串没有闭合',
  'Invalid number': '无效数字',
  'Invalid number — expected a digit after the decimal point': '无效数字 —— 小数点后需要数字',
  'Invalid number — expected a digit in the exponent': '无效数字 —— 指数部分需要数字',
  'Control character in string — it must be escaped': '字符串中出现控制字符 —— 必须转义',
  'Invalid escape \'\\{c}\'': '无效转义 \'\\{c}\'',
  'Invalid \\u escape — expected 4 hex digits': '无效的 \\u 转义 —— 需要 4 位十六进制',
  'Empty input': '输入为空',

  /* ---- Base64 ---- */
  'Base64 Encoder / Decoder': 'Base64 编解码',
  'Base64 Encoder / Decoder — Text & File': 'Base64 编解码 — 文本与文件',
  'Encode or decode text and files. Everything happens locally — nothing is uploaded.':
    '编解码文本和文件。全部在本地完成 —— 不上传任何内容。',
  'Input': '输入',
  'Output': '输出',
  'Encode →': '编码 →',
  '← Decode': '← 解码',
  '⇆ Swap': '⇆ 交换',
  'Copy result': '复制结果',
  'File → Base64': '文件 → Base64',
  'Pick a file to get its Base64 / Data URI. Handy for embedding images in CSS or HTML.':
    '选择文件即可得到它的 Base64 / Data URI，方便把图片内嵌进 CSS 或 HTML。',
  'Input does not look like valid Base64': '输入看起来不是有效的 Base64',
  'Decoded OK': '解码成功',
  'Decode failed: invalid Base64': '解码失败：Base64 无效',
  'Encode failed: {msg}': '编码失败：{msg}',
  'Encoded {a} chars → {b} chars': '已编码 {a} 个字符 → {b} 个字符',
  'File encoded to Data URI': '文件已编码为 Data URI',
  'File read failed': '文件读取失败',

  /* ---- 正则 ---- */
  'Regex Tester — Test Regular Expressions Online': '正则测试 — 在线测试正则表达式',
  'Test a regular expression against your text with live highlighting, groups and replace preview.':
    '用实时高亮、捕获组和替换预览来测试正则表达式。',
  'Regular expression': '正则表达式',
  'Test text': '测试文本',
  'Flags': '标志位',
  'g — global': 'g — 全局',
  'i — ignore case': 'i — 忽略大小写',
  'm — multiline': 'm — 多行',
  's — dotall': 's — 点匹配换行',
  'u — unicode': 'u — Unicode',
  'y — sticky': 'y — 粘性',
  'Highlighted matches': '匹配高亮',
  'Capture groups': '捕获组',
  'Replace preview': '替换预览',
  'No matches': '无匹配',
  'No text': '无文本',
  'no groups': '无捕获组',
  'Invalid regex: {msg}': '正则无效：{msg}',
  '{n} matches': '{n} 处匹配',
  '{n} match': '{n} 处匹配',
  '{n} · flags: {f}': '{n} · 标志位：{f}',
  '…and {n} more': '…还有 {n} 处',
  'undefined': '未定义',

  /* ---- 字数统计 ---- */
  'Word Counter — Characters, Words, Reading Time': '字数统计 — 字符、词数、阅读时长',
  'Live word, character and sentence counts with reading time. Handles English and Chinese text.':
    '实时统计词数、字符数和句子数，并估算阅读时长。中英文都支持。',
  'Statistics': '统计',
  'Words': '词数',
  'Characters': '字符数',
  'Characters (no spaces)': '字符数（不含空格）',
  'Letters': '字母数',
  'Digits': '数字个数',
  'Sentences': '句子数',
  'Paragraphs': '段落数',
  'Lines': '行数',
  'Blank lines': '空行',
  'Reading time': '阅读时长',
  'Speaking time': '朗读时长',
  'Most frequent words': '高频词',
  'Repeated word': '重复词',
  'No repeated words yet': '暂时没有重复词',
  'Copy stats': '复制统计',
  '{n} sec': '{n} 秒',
  '{n} min': '{n} 分',
  'Words: {w}\nCharacters: {c}\nCharacters (no spaces): {cs}\nSentences: {s}\nParagraphs: {p}':
    '词数：{w}\n字符数：{c}\n字符数（不含空格）：{cs}\n句子数：{s}\n段落数：{p}',

  /* ---- 图片压缩 ---- */
  'Image Compressor — Reduce JPG, PNG, WebP Size Online': '图片压缩 — 在线减小 JPG、PNG、WebP 体积',
  'Shrink and resize images without uploading them anywhere. Everything stays on your device.':
    '压缩和缩放图片，无需上传到任何地方。一切都在你的设备上完成。',
  'Drop an image here': '把图片拖到这里',
  'or click to choose': '或点击选择',
  'JPG · PNG · WebP · GIF (first frame)': 'JPG · PNG · WebP · GIF（首帧）',
  'Quality:': '质量：',
  'Max width (px)': '最大宽度（像素）',
  'JPEG — smallest, no transparency': 'JPEG — 体积最小，不支持透明',
  'PNG — lossless, keeps transparency': 'PNG — 无损，保留透明通道',
  'WebP — smaller, modern browsers': 'WebP — 体积更小，现代浏览器支持',
  'Compress': '压缩',
  'Compressing…': '正在压缩…',
  'Pick an image first': '请先选择一张图片',
  'Pick an image to begin': '选择一张图片开始',
  'Download': '下载',
  'Original': '原图',
  'Output': '输出',
  'Saved': '节省',
  'Format': '格式',
  'px': '像素',
  'Cannot read image': '无法读取图片',

  /* ---- PDF ---- */
  'PDF Merge & Split': 'PDF 合并与拆分',
  'PDF Merge & Split — Combine or Extract PDF Pages Free': 'PDF 合并与拆分 — 免费合并或提取 PDF 页面',
  'Combine several PDFs, or pull out a page range. Files are processed locally and never uploaded.':
    '合并多个 PDF，或提取页码范围。文件在本地处理，绝不上传。',
  'Merge PDFs': '合并 PDF',
  'Split / Extract pages': '拆分 / 提取页面',
  'Drop PDF files here': '把 PDF 文件拖到这里',
  'or click to choose (2 or more)': '或点击选择（2 个及以上）',
  'PDF file': 'PDF 文件',
  'Page range': '页码范围',
  'Use commas for separate pages and dashes for ranges.': '多页用逗号分隔，范围用短横线。',
  'Extract pages': '提取页面',
  'No files selected': '未选择文件',
  'Merging…': '正在合并…',
  'Extracting…': '正在提取…',
  'Select at least 2 PDF files': '请至少选择 2 个 PDF 文件',
  'Select a PDF to split': '请选择要拆分的 PDF',
  'Merge failed: {msg}': '合并失败：{msg}',
  'Split failed: {msg}': '拆分失败：{msg}',
  'Merged {n} files → {p} pages · {size}': '已合并 {n} 个文件 → {p} 页 · {size}',
  'Extracted {n} of {t} pages · {size}': '已提取 {n} / {t} 页 · {size}',
  'No valid pages. This PDF has {n} pages.': '没有有效的页码。该 PDF 共 {n} 页。',

  /* ---- 房贷 ---- */
  'Mortgage Calculator — Monthly Payment & Amortization': '房贷计算器 — 月供与还款计划',
  'Work out monthly payments, total interest and a full amortization schedule.':
    '算出月供、总利息和完整的还款计划表。',
  'Loan amount': '贷款金额',
  'Annual interest rate (%)': '年利率（%）',
  'Term (years)': '期限（年）',
  'Repayment type': '还款方式',
  'Equal payments (amortizing)': '等额本息',
  'Equal principal (linear)': '等额本金',
  'Show amortization': '显示还款计划',
  'Hide amortization': '隐藏还款计划',
  'Monthly payment': '月供',
  'First payment': '首期还款',
  'Last payment': '末期还款',
  'Total interest': '总利息',
  'Total paid': '还款总额',
  'Interest / principal': '利息 / 本金',
  'Payments': '还款期数',
  'Year': '年份',
  'Principal / Interest / Balance': '本金 / 利息 / 余额',
  'Enter a loan amount': '请输入贷款金额',
  '{n} months': '{n} 个月',

  /* ---- 日期计算 ---- */
  'Date Calculator — Days Between Dates, Add Days, Age': '日期计算器 — 日期间隔、日期加减、年龄',
  'Days between dates, date arithmetic, and exact age — all in one page.':
    '日期间隔天数、日期加减和精确年龄 —— 都在同一页。',
  'Days between two dates': '两个日期之间的天数',
  'Add / subtract from a date': '日期的加减',
  'Age calculator': '年龄计算',
  'Date': '日期',
  'Start date': '起始日期',
  'Date of birth': '出生日期',
  'Years': '年',
  'Months': '月',
  'Days': '日',
  'Pick two dates': '请选择两个日期',
  'Pick a start date': '请选择起始日期',
  'Pick a birth date': '请选择出生日期',
  'Total days': '总天数',
  'Weeks + days': '周 + 天',
  'Years / Months / Days': '年 / 月 / 日',
  'Hours': '小时',
  'Minutes': '分钟',
  'Result date': '结果日期',
  'Weekday': '星期',
  'Leap year': '闰年',
  'Yes': '是',
  'No': '否',
  'Age': '年龄',
  'Days lived': '已度过天数',
  'Next birthday in': '距离下次生日',
  '{d} days': '{d} 天',
  '{y} years {m} months {d} days': '{y} 年 {m} 个月 {d} 天',
  '{y} y {m} m {d} d': '{y} 年 {m} 月 {d} 日',
  '{w} weeks {d} days': '{w} 周 {d} 天',

  /* ---- 页面标题 / SEO 描述 ---- */
  'Toolbox — 16 Free Online Tools: Converters, Formatters, Calculators':
    'Toolbox — 16 个免费在线工具：换算、格式化、计算器',
  '16 free browser-based tools: unit and currency converter, password and UUID generator, QR code generator, JSON formatter, image compressor, PDF merge, regex tester, mortgage and date calculators and more. No signup, nothing uploaded.':
    '16 个免费的浏览器端工具：单位与汇率换算、密码与 UUID 生成、二维码生成、JSON 格式化、图片压缩、PDF 合并、正则测试、房贷与日期计算等。无需注册，不上传任何文件。',
  'Privacy Policy — Toolbox': '隐私政策 — Toolbox',
  'Privacy policy for Toolbox. Every tool runs locally in your browser; we do not collect, store or transmit the data you enter.':
    'Toolbox 隐私政策。所有工具都在你的浏览器本地运行；我们不会收集、存储或传输你输入的数据。',
  'Unit Converter — Length, Weight, Temperature, Area, Speed': '单位换算 — 长度、重量、温度、面积、速度',
  'Free online unit converter. Convert length, weight, temperature, area, volume and speed instantly in your browser.':
    '免费在线单位换算。在浏览器里即时换算长度、重量、温度、面积、体积和速度。',
  'Currency Converter — Live Exchange Rates': '汇率换算 — 实时汇率',
  'Free online currency converter with live exchange rates. Convert between USD, EUR, GBP, JPY, CNY and 30+ currencies.':
    '免费在线汇率换算，实时汇率。在美元、欧元、英镑、日元、人民币等 30 多种货币之间换算。',
  'Free Base64 encoder and decoder. Convert text or files to Base64 instantly in your browser. Supports URL-safe Base64 and Data URI output.':
    '免费的 Base64 编解码器。在浏览器里即时把文本或文件转成 Base64，支持 URL 安全变体和 Data URI 输出。',
  'Type text to encode, or paste Base64 to decode…': '输入要编码的文本，或粘贴 Base64 来解码…',
  'URL-safe variant (': 'URL 安全变体（',
  ', no padding )': '，无填充）',
  'Free case converter. Transform text to UPPERCASE, lowercase, Title Case, camelCase, PascalCase, snake_case, kebab-case and more, all at once.':
    '免费的大小写转换器。一次把文本转成大写、小写、标题式、camelCase、PascalCase、snake_case、kebab-case 等。',
  'Type or paste text here…': '在这里输入或粘贴文本…',
  'Free color converter. Convert between HEX, RGB and HSL, with live preview. Instantly copy color codes.':
    '免费的颜色转换器。在 HEX、RGB、HSL 之间转换，实时预览，一键复制色值。',
  'Free date calculator. Find days between two dates, add or subtract days/weeks/months, and calculate age precisely.':
    '免费的日期计算器。计算两个日期之间的天数，加减天数/周数/月数，并精确计算年龄。',
  'Free online image compressor. Shrink JPG, PNG and WebP files, resize and convert format. Nothing is uploaded — all processing happens in your browser.':
    '免费在线图片压缩。缩小 JPG、PNG、WebP 体积，调整尺寸、转换格式。不上传任何文件 —— 全部在你的浏览器里处理。',
  'Free online JSON formatter and validator. Pretty-print, minify, sort keys and check JSON syntax with line numbers. Runs in your browser.':
    '免费在线 JSON 格式化与校验工具。美化、压缩、键排序，检查 JSON 语法并给出行号。全部在浏览器里运行。',
  'Free mortgage and loan calculator. Get your monthly payment, total interest and a year-by-year amortization schedule.':
    '免费的房贷与贷款计算器。算出月供、总利息和逐年还款计划表。',
  'Free secure password generator. Create strong random passwords with custom length and character sets. Runs entirely in your browser.':
    '免费的安全密码生成器。自定义长度和字符集，生成强随机密码。完全在浏览器里运行。',
  'Free online PDF tools. Merge multiple PDFs into one, or extract a page range into a new file. Runs in your browser — files are never uploaded.':
    '免费在线 PDF 工具。把多个 PDF 合并成一个，或把页码范围提取成新文件。在浏览器里运行 —— 文件绝不上传。',
  'e.g. 1-3,5,7-9': '例：1-3,5,7-9',
  'Free QR code generator. Turn any text or URL into a downloadable PNG QR code. Runs entirely in your browser.':
    '免费的二维码生成器。把任意文本或网址变成可下载的 PNG 二维码。完全在浏览器里运行。',
  'Generate': '生成',
  'Free online regex tester. Test regular expressions with live match highlighting, capture groups, flags and replace preview.':
    '免费在线正则测试工具。实时高亮匹配，支持捕获组、标志位和替换预览。',
  'e.g. \\d{4}-\\d{2}-\\d{2}': '例：\\d{4}-\\d{2}-\\d{2}',
  'URL': '网址',
  'Replacement — use $1, $2 …': '替换内容 —— 用 $1、$2 …',
  'Convert Unix timestamps to human dates and back. Supports seconds and milliseconds, local time, UTC and ISO 8601. Free and instant.':
    'Unix 时间戳与可读日期互转。支持秒和毫秒、本地时间、UTC 和 ISO 8601。免费且即时。',
  'e.g. 1791500000': '例：1791500000',
  'Free UUID v4 generator. Create one or thousands of random UUIDs, with uppercase, no-dash and brace formats. Runs in your browser.':
    '免费的 UUID v4 生成器。生成一个或上千个随机 UUID，支持大写、去横线和花括号格式。在浏览器里运行。',
  'Free online word counter. Count words, characters, sentences and paragraphs, estimate reading time, and see the most frequent words.':
    '免费在线字数统计。统计词数、字符数、句子数和段落数，估算阅读时长，并列出高频词。',
  'Your text': '你的文本',
  'Paste or type your text here…': '在这里粘贴或输入文本…',

  /* ---- 通用 ---- */
  'Copy': '复制',
  'Copied!': '已复制！',
  'Result': '结果',
  'Email': '邮箱',
  'Input text': '输入文本',
  'Output format': '输出格式',
  '—': '—',

  /* ---- 单位名（顺序同 units.js 的 UNITS 表）---- */
  units: {
    length: ['米 (m)', '千米 (km)', '厘米 (cm)', '毫米 (mm)', '英里 (mi)', '码 (yd)', '英尺 (ft)', '英寸 (in)', '海里 (nmi)'],
    weight: ['千克 (kg)', '克 (g)', '毫克 (mg)', '公吨 (t)', '磅 (lb)', '盎司 (oz)', '英石 (st)'],
    area:   ['平方米 (m²)', '平方千米 (km²)', '平方厘米 (cm²)', '公顷 (ha)', '英亩 (ac)', '平方英尺 (ft²)', '平方英寸 (in²)', '平方英里 (mi²)'],
    volume: ['升 (L)', '毫升 (mL)', '立方米 (m³)', '美制加仑 (gal)', '美制夸脱 (qt)', '美制品脱 (pt)', '美制杯', '美制液量盎司 (fl oz)', '英制加仑 (gal UK)'],
    speed:  ['米/秒 (m/s)', '千米/时 (km/h)', '英里/时 (mph)', '节 (kn)', '英尺/秒 (ft/s)'],
    time:   ['秒 (s)', '毫秒 (ms)', '分钟 (min)', '小时 (h)', '天 (d)', '周 (wk)', '月 (30 天)', '年 (365 天)'],
    data:   ['字节 (B)', '位 (b)', '千字节 (KB)', '兆字节 (MB)', '吉字节 (GB)', '太字节 (TB)'],
    temperature: ['摄氏度 (°C)', '华氏度 (°F)', '开尔文 (K)']
  }
};

/* ------------------------------ Español ------------------------------ */
I18N.es = {

  /* ---- 外壳 ---- */
  'Home': 'Inicio',
  'Privacy': 'Privacidad',
  'Privacy Policy': 'Política de privacidad',
  'Tools': 'Herramientas',
  'Language': 'Idioma',
  'Converters': 'Conversores',
  'Generators': 'Generadores',
  'Text & Code': 'Texto y código',
  'Files & Media': 'Archivos y medios',
  'Calculators': 'Calculadoras',

  /* ---- 导航工具名 ---- */
  'Unit Converter': 'Conversor de unidades',
  'Currency Converter': 'Conversor de divisas',
  'Timestamp Converter': 'Conversor de marcas de tiempo',
  'Color Converter': 'Conversor de colores',
  'Case Converter': 'Conversor de mayúsculas',
  'Password Generator': 'Generador de contraseñas',
  'UUID Generator': 'Generador de UUID',
  'QR Code Generator': 'Generador de códigos QR',
  'JSON Formatter': 'Formateador JSON',
  'Base64 Encoder': 'Codificador Base64',
  'Regex Tester': 'Probador de expresiones regulares',
  'Word Counter': 'Contador de palabras',
  'Image Compressor': 'Compresor de imágenes',
  'PDF Merge / Split': 'Unir / dividir PDF',
  'Mortgage Calculator': 'Calculadora de hipotecas',
  'Date Calculator': 'Calculadora de fechas',

  /* ---- 广告位 ---- */
  'Ad slot — 728x90 / responsive': 'Espacio publicitario — 728x90 / adaptable',
  'Ad slot — 300x250': 'Espacio publicitario — 300x250',

  /* ---- 页脚 ---- */
  '© 2026 Toolbox. All tools run locally in your browser.': '© 2026 Toolbox. Todas las herramientas se ejecutan localmente en tu navegador.',
  '© 2026 Toolbox. Estimates only — not financial advice.': '© 2026 Toolbox. Solo estimaciones — no es asesoramiento financiero.',
  '© 2026 Toolbox. Generated locally with Web Crypto.': '© 2026 Toolbox. Generado localmente con Web Crypto.',
  '© 2026 Toolbox. Generated with Web Crypto.': '© 2026 Toolbox. Generado con Web Crypto.',
  '© 2026 Toolbox. Images never leave your browser.': '© 2026 Toolbox. Tus imágenes nunca salen del navegador.',
  '© 2026 Toolbox. Powered by pdf-lib, running locally.': '© 2026 Toolbox. Basado en pdf-lib, ejecutado localmente.',
  '© 2026 Toolbox. QR encoding uses a compact built-in renderer.': '© 2026 Toolbox. La codificación QR usa un generador integrado compacto.',
  '© 2026 Toolbox. Rates from open exchange-rate API.': '© 2026 Toolbox. Tipos de cambio de una API pública.',

  /* ---- 首页 ---- */
  'Free tools that just work': 'Herramientas gratuitas que simplemente funcionan',
  'Fast, private, browser-based utilities. No signup, no upload — everything runs on your device.':
    'Utilidades rápidas y privadas que funcionan en tu navegador. Sin registro y sin subir nada: todo se ejecuta en tu dispositivo.',
  'Length, weight, temperature, area, volume, speed, time and data storage.':
    'Longitud, peso, temperatura, área, volumen, velocidad, tiempo y almacenamiento de datos.',
  'Convert between 30+ currencies with live exchange rates.': 'Convierte entre más de 30 divisas con tipos de cambio en vivo.',
  'Unix epoch ↔ date, in seconds or milliseconds, local and UTC.': 'Época Unix ↔ fecha, en segundos o milisegundos, hora local y UTC.',
  'UPPER, lower, Title, camelCase, snake_case, kebab-case and more.': 'MAYÚSCULAS, minúsculas, Tipo Título, camelCase, snake_case, kebab-case y más.',
  'HEX ↔ RGB ↔ HSL. Pick and preview colors instantly.': 'HEX ↔ RGB ↔ HSL. Elige y previsualiza colores al instante.',
  'Strong random passwords with a strength meter. Never leaves your browser.': 'Contraseñas aleatorias seguras con medidor de fuerza. Nunca salen de tu navegador.',
  'Random UUID v4 values in bulk, with uppercase and no-dash options.': 'Valores UUID v4 aleatorios en bloque, con opciones de mayúsculas y sin guiones.',
  'Turn any text or URL into a downloadable QR code image.': 'Convierte cualquier texto o URL en una imagen QR descargable.',
  'Pretty-print, minify, sort keys and validate JSON with line numbers.': 'Formatea, minimiza, ordena claves y valida JSON con números de línea.',
  'Encode or decode text and files. URL-safe variant and Data URI output.': 'Codifica o decodifica texto y archivos. Variante URL-safe y salida Data URI.',
  'Live match highlighting, capture groups and replace preview.': 'Resaltado de coincidencias en vivo, grupos de captura y vista previa de reemplazo.',
  'Words, characters, sentences, reading time and top words.': 'Palabras, caracteres, frases, tiempo de lectura y palabras más frecuentes.',
  'Shrink and resize JPG, PNG and WebP without uploading.': 'Reduce y redimensiona JPG, PNG y WebP sin subir nada.',
  'Combine several PDFs or extract a page range into a new file.': 'Combina varios PDF o extrae un rango de páginas a un archivo nuevo.',
  'Monthly payment, total interest and a year-by-year amortization table.': 'Cuota mensual, intereses totales y tabla de amortización año a año.',
  'Days between dates, date arithmetic and exact age.': 'Días entre fechas, aritmética de fechas y edad exacta.',
  'Why Toolbox': 'Por qué Toolbox',
  'Every tool runs entirely in your browser with plain JavaScript — nothing is sent to a server. That means it loads instantly, works offline, and keeps your data private. Bookmark any tool and use it any time.':
    'Cada herramienta se ejecuta por completo en tu navegador con JavaScript puro: no se envía nada a ningún servidor. Por eso carga al instante, funciona sin conexión y mantiene tus datos privados. Guarda cualquier herramienta en favoritos y úsala cuando quieras.',

  /* ---- 隐私政策 ---- */
  'Last updated: October 7, 2026': 'Última actualización: 7 de octubre de 2026',
  '1. What we collect': '1. Qué recopilamos',
  '2. Files you open': '2. Archivos que abres',
  '3. Cookies and third-party advertising': '3. Cookies y publicidad de terceros',
  '4. Server logs': '4. Registros del servidor',
  '5. Children': '5. Menores',
  '6. Your rights': '6. Tus derechos',
  '7. Changes': '7. Cambios',
  '8. Contact': '8. Contacto',
  'Nothing. Toolbox has no accounts, no sign-up and no server-side storage. Every tool on this site is a plain HTML/CSS/JavaScript page that executes entirely inside your browser. The text you type, the files you pick and the values you calculate are processed on your device and are never transmitted to us.':
    'Nada. Toolbox no tiene cuentas, ni registro, ni almacenamiento en servidor. Cada herramienta de este sitio es una página HTML/CSS/JavaScript normal que se ejecuta por completo dentro de tu navegador. El texto que escribes, los archivos que eliges y los valores que calculas se procesan en tu dispositivo y nunca se nos transmiten.',
  'Tools such as the Image Compressor, PDF Merge / Split and Base64 Encoder read files through the browser\'s local File API. Those files stay in your browser\'s memory. They are not uploaded, and closing the tab discards them.':
    'Herramientas como el Compresor de imágenes, Unir / dividir PDF y el Codificador Base64 leen archivos mediante la API File local del navegador. Esos archivos permanecen en la memoria del navegador. No se suben y, al cerrar la pestaña, se descartan.',
  'We do not set cookies for our own purposes. This site is supported by advertising, and the advertising partners we work with may set cookies or read device identifiers in order to serve and measure ads.':
    'No instalamos cookies con fines propios. Este sitio se sostiene con publicidad, y los socios publicitarios con los que trabajamos pueden instalar cookies o leer identificadores del dispositivo para mostrar y medir anuncios.',
  'Third-party vendors, including Google, may use cookies to serve ads based on your prior visits to this site or to other sites. Google\'s use of advertising cookies enables it and its partners to serve ads to you based on your visit to this site and/or other sites on the internet.':
    'Proveedores externos, incluido Google, pueden usar cookies para mostrar anuncios basados en tus visitas anteriores a este sitio o a otros sitios. El uso que Google hace de las cookies publicitarias permite que él y sus socios te muestren anuncios basados en tu visita a este sitio y/o a otros sitios de internet.',
  'You can opt out of personalised advertising by visiting': 'Puedes desactivar la publicidad personalizada visitando',
  'Google Ads Settings': 'Configuración de anuncios de Google',
  ', or opt out of third-party vendor cookies for personalised advertising at':
    ', o desactivar las cookies de proveedores externos para publicidad personalizada en',
  '. If you are in the European Economic Area, the United Kingdom or Switzerland, you will be asked for consent before any personalised advertising cookie is set, and you may withdraw that consent at any time.':
    '. Si te encuentras en el Espacio Económico Europeo, el Reino Unido o Suiza, se te pedirá consentimiento antes de instalar cualquier cookie de publicidad personalizada, y puedes retirar ese consentimiento en cualquier momento.',
  'Like any website, our hosting provider may record standard request logs — IP address, user agent, requested path and timestamp — for security and abuse prevention. These logs are not linked to any information you enter into a tool.':
    'Como cualquier sitio web, nuestro proveedor de alojamiento puede registrar logs estándar de peticiones —dirección IP, user agent, ruta solicitada y marca de tiempo— por seguridad y prevención de abusos. Estos registros no se vinculan con ninguna información que introduzcas en una herramienta.',
  'This site is not directed at children under 13, and we do not knowingly collect personal information from them.':
    'Este sitio no está dirigido a menores de 13 años y no recopilamos a sabiendas información personal de ellos.',
  'Because we hold no personal data about you, there is nothing for us to export, correct or delete. Requests concerning advertising data should be directed to the relevant ad vendor using the opt-out links in section 3.':
    'Como no conservamos ningún dato personal tuyo, no hay nada que podamos exportar, corregir o eliminar. Las solicitudes relativas a datos publicitarios deben dirigirse al proveedor de publicidad correspondiente mediante los enlaces de exclusión de la sección 3.',
  'If this policy changes, the revised version will be posted on this page with an updated date.':
    'Si esta política cambia, la versión revisada se publicará en esta página con una fecha actualizada.',
  'Questions about this policy:': 'Preguntas sobre esta política:',

  /* ---- 单位换算 ---- */
  'Convert between common units of length, weight, temperature, area, volume and speed.':
    'Convierte entre las unidades habituales de longitud, peso, temperatura, área, volumen y velocidad.',
  'Category': 'Categoría',
  'Value': 'Valor',
  'From': 'De',
  'To': 'A',
  '⇆ Swap units': '⇆ Intercambiar unidades',
  'Copy result': 'Copiar resultado',
  'Length': 'Longitud',
  'Weight / Mass': 'Peso / Masa',
  'Temperature': 'Temperatura',
  'Area': 'Área',
  'Volume': 'Volumen',
  'Speed': 'Velocidad',
  'Time': 'Tiempo',
  'Digital Storage': 'Almacenamiento digital',

  /* ---- 汇率换算 ---- */
  'Convert between 30+ currencies using live exchange rates.': 'Convierte entre más de 30 divisas usando tipos de cambio en vivo.',
  'Amount': 'Importe',
  '⇆ Swap': '⇆ Intercambiar',
  'Refresh rates': 'Actualizar tipos',
  'Popular conversions': 'Conversiones populares',
  'Fetching live rates…': 'Obteniendo tipos en vivo…',
  'Refreshing…': 'Actualizando…',
  'Live rates · updated {t}': 'Tipos en vivo · actualizado {t}',
  'Offline — using built-in fallback rates': 'Sin conexión — usando tipos de cambio integrados',
  '1 {a} = {b} {c} · live rates': '1 {a} = {b} {c} · tipos en vivo',

  /* ---- 时间戳 ---- */
  'Unix Timestamp Converter': 'Conversor de marcas de tiempo Unix',
  'Unix Timestamp Converter — Epoch to Date': 'Conversor de marcas de tiempo Unix — de época a fecha',
  'Paste a timestamp to get a date, or pick a date to get its timestamp. Seconds and milliseconds auto-detected.':
    'Pega una marca de tiempo para obtener la fecha, o elige una fecha para obtener su marca de tiempo. Se detectan automáticamente segundos y milisegundos.',
  'Unix timestamp': 'Marca de tiempo Unix',
  'Date & time (local)': 'Fecha y hora (local)',
  'Timestamp → Date': 'Marca de tiempo → Fecha',
  'Date → Timestamp': 'Fecha → Marca de tiempo',
  'Use current time': 'Usar la hora actual',
  'Detected': 'Detectado',
  'seconds': 'segundos',
  'milliseconds': 'milisegundos',
  'Local': 'Local',
  'UTC': 'UTC',
  'ISO 8601': 'ISO 8601',
  'RFC 2822': 'RFC 2822',
  'Relative': 'Relativo',
  'Seconds': 'Segundos',
  'Milliseconds': 'Milisegundos',
  'Invalid date': 'Fecha no válida',
  'Enter a valid number': 'Introduce un número válido',
  'just now': 'ahora mismo',
  'Clear': 'Limpiar',

  /* ---- 颜色转换 ---- */
  'Color Converter — HEX, RGB, HSL': 'Conversor de colores — HEX, RGB, HSL',
  'Convert HEX ↔ RGB ↔ HSL with a live preview. Pick a color or type a value.':
    'Convierte HEX ↔ RGB ↔ HSL con vista previa en vivo. Elige un color o escribe un valor.',
  'HEX': 'HEX',
  'RGB': 'RGB',
  'HSL': 'HSL',
  'Hex color': 'Color HEX',
  'Pick a color': 'Elige un color',
  'Random color': 'Color aleatorio',
  'Copy HEX': 'Copiar HEX',
  'Copy RGB': 'Copiar RGB',
  'Copy HSL': 'Copiar HSL',

  /* ---- 大小写转换 ---- */
  'Case Converter — UPPER, lower, camelCase, snake_case': 'Conversor de mayúsculas — MAYÚSCULAS, minúsculas, camelCase, snake_case',
  'Type once, get every naming style at the same time — including camelCase and snake_case for code.':
    'Escribe una vez y obtén todos los estilos de nomenclatura a la vez, incluidos camelCase y snake_case para código.',
  'Title Case': 'Tipo Título',
  'Sentence case': 'Tipo frase',

  /* ---- 密码生成 ---- */
  'Password Generator — Strong Random Passwords': 'Generador de contraseñas — contraseñas aleatorias seguras',
  'Generate strong passwords with a cryptographically secure random source. Nothing is sent anywhere.':
    'Genera contraseñas seguras con una fuente aleatoria criptográficamente segura. No se envía nada a ningún sitio.',
  'Generated password': 'Contraseña generada',
  'Length:': 'Longitud:',
  'Uppercase (A-Z)': 'Mayúsculas (A-Z)',
  'Lowercase (a-z)': 'Minúsculas (a-z)',
  'Numbers (0-9)': 'Números (0-9)',
  'Symbols (!@#$…)': 'Símbolos (!@#$…)',
  'Avoid ambiguous (0 O o 1 l I |)': 'Evitar caracteres ambiguos (0 O o 1 l I |)',
  'Quick presets': 'Ajustes rápidos',
  '↻ Generate': '↻ Generar',
  'Weak': 'Débil',
  'Fair': 'Aceptable',
  'Strong': 'Fuerte',
  'Very strong': 'Muy fuerte',
  '{label} · ~{bits} bits of entropy': '{label} · ~{bits} bits de entropía',

  /* ---- UUID ---- */
  'UUID Generator — Random v4 UUIDs': 'Generador de UUID — UUID v4 aleatorios',
  'Generate cryptographically random UUID v4 values, one at a time or in bulk.':
    'Genera valores UUID v4 criptográficamente aleatorios, de uno en uno o en bloque.',
  'How many': 'Cuántos',
  'Uppercase': 'Mayúsculas',
  'No dashes': 'Sin guiones',
  'Braces {}': 'Llaves {}',
  'Copy all': 'Copiar todo',
  'Download .txt': 'Descargar .txt',

  /* ---- 二维码 ---- */
  'QR Code Generator — Text & URL to QR': 'Generador de códigos QR — de texto y URL a QR',
  'Type any text or URL and download it as a QR code image. Everything happens in your browser.':
    'Escribe cualquier texto o URL y descárgalo como imagen de código QR. Todo ocurre en tu navegador.',
  'Text or URL': 'Texto o URL',
  'Size:': 'Tamaño:',
  'Error correction': 'Corrección de errores',
  'QR preview': 'Vista previa del QR',
  'Download PNG': 'Descargar PNG',
  'L — 7%': 'L — 7%',
  'M — 15%': 'M — 15%',
  'Q — 25%': 'Q — 25%',
  'H — 30%': 'H — 30%',
  'Text too long for this build (max v10). Shorten it.': 'Texto demasiado largo para esta versión (máx. v10). Acórtalo.',

  /* ---- JSON ---- */
  'JSON Formatter & Validator': 'Formateador y validador JSON',
  'JSON Formatter & Validator — Pretty Print, Minify': 'Formateador y validador JSON — Formatear, minimizar',
  'Pretty-print, minify and validate JSON. Errors are reported with line and column.':
    'Formatea, minimiza y valida JSON. Los errores se indican con línea y columna.',
  'JSON input': 'Entrada JSON',
  'Indent': 'Sangría',
  'Sort keys alphabetically': 'Ordenar claves alfabéticamente',
  'Format': 'Formatear',
  'Minify': 'Minimizar',
  '1 space': '1 espacio',
  '2 spaces': '2 espacios',
  '4 spaces': '4 espacios',
  'Tab-less (compact)': 'Sin sangría (compacto)',
  'Invalid JSON': 'JSON no válido',
  '(line {l}, col {c})': '(línea {l}, columna {c})',
  'Valid JSON · {k} keys · depth {d} · {b} bytes': 'JSON válido · {k} claves · profundidad {d} · {b} bytes',
  'Unexpected end of input — expected a value': 'Fin de entrada inesperado — se esperaba un valor',
  'Unexpected end of input — the array is not closed': 'Fin de entrada inesperado — el array no está cerrado',
  'Unexpected end of input — the object is not closed': 'Fin de entrada inesperado — el objeto no está cerrado',
  'Unexpected end of input — expected \':\'': 'Fin de entrada inesperado — se esperaba \':\'',
  'Unexpected token \'{c}\' — expected a value': 'Token inesperado \'{c}\' — se esperaba un valor',
  'Unexpected token \'{c}\' after the JSON value': 'Token inesperado \'{c}\' después del valor JSON',
  'Expected \',\' or \']\' but found \'{c}\'': 'Se esperaba \',\' o \']\' pero se encontró \'{c}\'',
  'Expected \',\' or \'}\' but found \'{c}\'': 'Se esperaba \',\' o \'}\' pero se encontró \'{c}\'',
  'Expected a double-quoted property name but found \'{c}\'': 'Se esperaba un nombre de propiedad entre comillas dobles pero se encontró \'{c}\'',
  'Expected \':\' after the property name but found \'{c}\'': 'Se esperaba \':\' después del nombre de la propiedad pero se encontró \'{c}\'',
  'Trailing comma is not allowed in JSON': 'No se permite una coma final en JSON',
  'Unterminated string': 'Cadena sin cerrar',
  'Invalid number': 'Número no válido',
  'Invalid number — expected a digit after the decimal point': 'Número no válido — se esperaba un dígito tras el punto decimal',
  'Invalid number — expected a digit in the exponent': 'Número no válido — se esperaba un dígito en el exponente',
  'Control character in string — it must be escaped': 'Carácter de control en la cadena — debe escaparse',
  'Invalid escape \'\\{c}\'': 'Secuencia de escape no válida \'\\{c}\'',
  'Invalid \\u escape — expected 4 hex digits': 'Escape \\u no válido — se esperaban 4 dígitos hexadecimales',
  'Empty input': 'Entrada vacía',

  /* ---- Base64 ---- */
  'Base64 Encoder / Decoder': 'Codificador / decodificador Base64',
  'Base64 Encoder / Decoder — Text & File': 'Codificador / decodificador Base64 — texto y archivos',
  'Encode or decode text and files. Everything happens locally — nothing is uploaded.':
    'Codifica o decodifica texto y archivos. Todo ocurre localmente: no se sube nada.',
  'Input': 'Entrada',
  'Output': 'Salida',
  'Encode →': 'Codificar →',
  '← Decode': '← Decodificar',
  '⇆ Swap': '⇆ Intercambiar',
  'Copy result': 'Copiar resultado',
  'File → Base64': 'Archivo → Base64',
  'Pick a file to get its Base64 / Data URI. Handy for embedding images in CSS or HTML.':
    'Elige un archivo para obtener su Base64 / Data URI. Útil para incrustar imágenes en CSS o HTML.',
  'Input does not look like valid Base64': 'La entrada no parece ser Base64 válido',
  'Decoded OK': 'Decodificado correctamente',
  'Decode failed: invalid Base64': 'Error al decodificar: Base64 no válido',
  'Encode failed: {msg}': 'Error al codificar: {msg}',
  'Encoded {a} chars → {b} chars': 'Codificados {a} caracteres → {b} caracteres',
  'File encoded to Data URI': 'Archivo codificado como Data URI',
  'File read failed': 'Error al leer el archivo',

  /* ---- 正则 ---- */
  'Regex Tester — Test Regular Expressions Online': 'Probador de regex — prueba expresiones regulares online',
  'Test a regular expression against your text with live highlighting, groups and replace preview.':
    'Prueba una expresión regular contra tu texto con resaltado en vivo, grupos y vista previa de reemplazo.',
  'Regular expression': 'Expresión regular',
  'Test text': 'Texto de prueba',
  'Flags': 'Opciones',
  'g — global': 'g — global',
  'i — ignore case': 'i — ignorar mayúsculas',
  'm — multiline': 'm — multilínea',
  's — dotall': 's — punto total',
  'u — unicode': 'u — unicode',
  'y — sticky': 'y — sticky',
  'Highlighted matches': 'Coincidencias resaltadas',
  'Capture groups': 'Grupos de captura',
  'Replace preview': 'Vista previa del reemplazo',
  'No matches': 'Sin coincidencias',
  'No text': 'Sin texto',
  'no groups': 'sin grupos',
  'Invalid regex: {msg}': 'Regex no válida: {msg}',
  '{n} matches': '{n} coincidencias',
  '{n} match': '{n} coincidencia',
  '{n} · flags: {f}': '{n} · opciones: {f}',
  '…and {n} more': '…y {n} más',
  'undefined': 'indefinido',

  /* ---- 字数统计 ---- */
  'Word Counter — Characters, Words, Reading Time': 'Contador de palabras — caracteres, palabras, tiempo de lectura',
  'Live word, character and sentence counts with reading time. Handles English and Chinese text.':
    'Recuento en vivo de palabras, caracteres y frases con tiempo de lectura. Compatible con texto en inglés y chino.',
  'Statistics': 'Estadísticas',
  'Words': 'Palabras',
  'Characters': 'Caracteres',
  'Characters (no spaces)': 'Caracteres (sin espacios)',
  'Letters': 'Letras',
  'Digits': 'Dígitos',
  'Sentences': 'Frases',
  'Paragraphs': 'Párrafos',
  'Lines': 'Líneas',
  'Blank lines': 'Líneas en blanco',
  'Reading time': 'Tiempo de lectura',
  'Speaking time': 'Tiempo de lectura en voz alta',
  'Most frequent words': 'Palabras más frecuentes',
  'Repeated word': 'Palabra repetida',
  'No repeated words yet': 'Aún no hay palabras repetidas',
  'Copy stats': 'Copiar estadísticas',
  '{n} sec': '{n} s',
  '{n} min': '{n} min',
  'Words: {w}\nCharacters: {c}\nCharacters (no spaces): {cs}\nSentences: {s}\nParagraphs: {p}':
    'Palabras: {w}\nCaracteres: {c}\nCaracteres (sin espacios): {cs}\nFrases: {s}\nPárrafos: {p}',

  /* ---- 图片压缩 ---- */
  'Image Compressor — Reduce JPG, PNG, WebP Size Online': 'Compresor de imágenes — reduce el tamaño de JPG, PNG y WebP online',
  'Shrink and resize images without uploading them anywhere. Everything stays on your device.':
    'Reduce y redimensiona imágenes sin subirlas a ningún sitio. Todo se queda en tu dispositivo.',
  'Drop an image here': 'Suelta una imagen aquí',
  'or click to choose': 'o haz clic para elegir',
  'JPG · PNG · WebP · GIF (first frame)': 'JPG · PNG · WebP · GIF (primer fotograma)',
  'Quality:': 'Calidad:',
  'Max width (px)': 'Ancho máximo (px)',
  'JPEG — smallest, no transparency': 'JPEG — el más pequeño, sin transparencia',
  'PNG — lossless, keeps transparency': 'PNG — sin pérdida, conserva la transparencia',
  'WebP — smaller, modern browsers': 'WebP — más pequeño, navegadores modernos',
  'Compress': 'Comprimir',
  'Compressing…': 'Comprimiendo…',
  'Pick an image first': 'Elige primero una imagen',
  'Pick an image to begin': 'Elige una imagen para empezar',
  'Download': 'Descargar',
  'Original': 'Original',
  'Output': 'Resultado',
  'Saved': 'Ahorro',
  'Format': 'Formato',
  'px': 'px',
  'Cannot read image': 'No se puede leer la imagen',

  /* ---- PDF ---- */
  'PDF Merge & Split': 'Unir y dividir PDF',
  'PDF Merge & Split — Combine or Extract PDF Pages Free': 'Unir y dividir PDF — combina o extrae páginas gratis',
  'Combine several PDFs, or pull out a page range. Files are processed locally and never uploaded.':
    'Combina varios PDF o extrae un rango de páginas. Los archivos se procesan localmente y nunca se suben.',
  'Merge PDFs': 'Unir PDF',
  'Split / Extract pages': 'Dividir / extraer páginas',
  'Drop PDF files here': 'Suelta aquí los archivos PDF',
  'or click to choose (2 or more)': 'o haz clic para elegir (2 o más)',
  'PDF file': 'Archivo PDF',
  'Page range': 'Rango de páginas',
  'Use commas for separate pages and dashes for ranges.': 'Usa comas para páginas sueltas y guiones para rangos.',
  'Extract pages': 'Extraer páginas',
  'No files selected': 'Ningún archivo seleccionado',
  'Merging…': 'Uniendo…',
  'Extracting…': 'Extrayendo…',
  'Select at least 2 PDF files': 'Selecciona al menos 2 archivos PDF',
  'Select a PDF to split': 'Selecciona un PDF para dividir',
  'Merge failed: {msg}': 'Error al unir: {msg}',
  'Split failed: {msg}': 'Error al dividir: {msg}',
  'Merged {n} files → {p} pages · {size}': '{n} archivos unidos → {p} páginas · {size}',
  'Extracted {n} of {t} pages · {size}': 'Extraídas {n} de {t} páginas · {size}',
  'No valid pages. This PDF has {n} pages.': 'No hay páginas válidas. Este PDF tiene {n} páginas.',

  /* ---- 房贷 ---- */
  'Mortgage Calculator — Monthly Payment & Amortization': 'Calculadora de hipotecas — cuota mensual y amortización',
  'Work out monthly payments, total interest and a full amortization schedule.':
    'Calcula la cuota mensual, los intereses totales y un plan de amortización completo.',
  'Loan amount': 'Importe del préstamo',
  'Annual interest rate (%)': 'Tipo de interés anual (%)',
  'Term (years)': 'Plazo (años)',
  'Repayment type': 'Tipo de amortización',
  'Equal payments (amortizing)': 'Cuotas iguales (francés)',
  'Equal principal (linear)': 'Capital igual (lineal)',
  'Show amortization': 'Mostrar amortización',
  'Hide amortization': 'Ocultar amortización',
  'Monthly payment': 'Cuota mensual',
  'First payment': 'Primera cuota',
  'Last payment': 'Última cuota',
  'Total interest': 'Intereses totales',
  'Total paid': 'Total pagado',
  'Interest / principal': 'Intereses / capital',
  'Payments': 'Cuotas',
  'Year': 'Año',
  'Principal / Interest / Balance': 'Capital / Intereses / Saldo',
  'Enter a loan amount': 'Introduce el importe del préstamo',
  '{n} months': '{n} meses',

  /* ---- 日期计算 ---- */
  'Date Calculator — Days Between Dates, Add Days, Age': 'Calculadora de fechas — días entre fechas, sumar días, edad',
  'Days between dates, date arithmetic, and exact age — all in one page.':
    'Días entre fechas, aritmética de fechas y edad exacta, todo en una página.',
  'Days between two dates': 'Días entre dos fechas',
  'Add / subtract from a date': 'Sumar / restar a una fecha',
  'Age calculator': 'Calculadora de edad',
  'Date': 'Fecha',
  'Start date': 'Fecha de inicio',
  'Date of birth': 'Fecha de nacimiento',
  'Years': 'Años',
  'Months': 'Meses',
  'Days': 'Días',
  'Pick two dates': 'Elige dos fechas',
  'Pick a start date': 'Elige una fecha de inicio',
  'Pick a birth date': 'Elige una fecha de nacimiento',
  'Total days': 'Días totales',
  'Weeks + days': 'Semanas + días',
  'Years / Months / Days': 'Años / Meses / Días',
  'Hours': 'Horas',
  'Minutes': 'Minutos',
  'Result date': 'Fecha resultante',
  'Weekday': 'Día de la semana',
  'Leap year': 'Año bisiesto',
  'Yes': 'Sí',
  'No': 'No',
  'Age': 'Edad',
  'Days lived': 'Días vividos',
  'Next birthday in': 'Próximo cumpleaños en',
  '{d} days': '{d} días',
  '{y} years {m} months {d} days': '{y} años {m} meses {d} días',
  '{y} y {m} m {d} d': '{y} a {m} m {d} d',
  '{w} weeks {d} days': '{w} semanas {d} días',

  /* ---- 页面标题 / SEO 描述 ---- */
  'Toolbox — 16 Free Online Tools: Converters, Formatters, Calculators':
    'Toolbox — 16 herramientas online gratuitas: conversores, formateadores, calculadoras',
  '16 free browser-based tools: unit and currency converter, password and UUID generator, QR code generator, JSON formatter, image compressor, PDF merge, regex tester, mortgage and date calculators and more. No signup, nothing uploaded.':
    '16 herramientas gratuitas que funcionan en el navegador: conversor de unidades y divisas, generador de contraseñas y UUID, generador de códigos QR, formateador JSON, compresor de imágenes, unir PDF, probador de regex, calculadoras de hipoteca y fechas y más. Sin registro y sin subir archivos.',
  'Privacy Policy — Toolbox': 'Política de privacidad — Toolbox',
  'Privacy policy for Toolbox. Every tool runs locally in your browser; we do not collect, store or transmit the data you enter.':
    'Política de privacidad de Toolbox. Cada herramienta se ejecuta localmente en tu navegador; no recopilamos, almacenamos ni transmitimos los datos que introduces.',
  'Unit Converter — Length, Weight, Temperature, Area, Speed': 'Conversor de unidades — longitud, peso, temperatura, área, velocidad',
  'Free online unit converter. Convert length, weight, temperature, area, volume and speed instantly in your browser.':
    'Conversor de unidades online gratis. Convierte longitud, peso, temperatura, área, volumen y velocidad al instante en tu navegador.',
  'Currency Converter — Live Exchange Rates': 'Conversor de divisas — tipos de cambio en vivo',
  'Free online currency converter with live exchange rates. Convert between USD, EUR, GBP, JPY, CNY and 30+ currencies.':
    'Conversor de divisas online gratis con tipos de cambio en vivo. Convierte entre USD, EUR, GBP, JPY, CNY y más de 30 divisas.',
  'Free Base64 encoder and decoder. Convert text or files to Base64 instantly in your browser. Supports URL-safe Base64 and Data URI output.':
    'Codificador y decodificador Base64 gratis. Convierte texto o archivos a Base64 al instante en tu navegador. Compatible con Base64 URL-safe y salida Data URI.',
  'Type text to encode, or paste Base64 to decode…': 'Escribe el texto a codificar o pega Base64 para decodificar…',
  'URL-safe variant (': 'Variante URL-safe (',
  ', no padding )': ' , sin relleno )',
  'Free case converter. Transform text to UPPERCASE, lowercase, Title Case, camelCase, PascalCase, snake_case, kebab-case and more, all at once.':
    'Conversor de mayúsculas gratis. Transforma el texto a MAYÚSCULAS, minúsculas, Tipo Título, camelCase, PascalCase, snake_case, kebab-case y más, todo a la vez.',
  'Type or paste text here…': 'Escribe o pega aquí el texto…',
  'Free color converter. Convert between HEX, RGB and HSL, with live preview. Instantly copy color codes.':
    'Conversor de colores gratis. Convierte entre HEX, RGB y HSL con vista previa en vivo. Copia los códigos de color al instante.',
  'Free date calculator. Find days between two dates, add or subtract days/weeks/months, and calculate age precisely.':
    'Calculadora de fechas gratis. Calcula los días entre dos fechas, suma o resta días/semanas/meses y obtén la edad con precisión.',
  'Free online image compressor. Shrink JPG, PNG and WebP files, resize and convert format. Nothing is uploaded — all processing happens in your browser.':
    'Compresor de imágenes online gratis. Reduce el tamaño de archivos JPG, PNG y WebP, cambia el tamaño y convierte el formato. No se sube nada: todo se procesa en tu navegador.',
  'Free online JSON formatter and validator. Pretty-print, minify, sort keys and check JSON syntax with line numbers. Runs in your browser.':
    'Formateador y validador JSON online gratis. Formatea, minimiza, ordena claves y comprueba la sintaxis JSON con números de línea. Se ejecuta en tu navegador.',
  'Free mortgage and loan calculator. Get your monthly payment, total interest and a year-by-year amortization schedule.':
    'Calculadora de hipotecas y préstamos gratis. Obtén la cuota mensual, los intereses totales y un plan de amortización año a año.',
  'Free secure password generator. Create strong random passwords with custom length and character sets. Runs entirely in your browser.':
    'Generador de contraseñas seguras gratis. Crea contraseñas aleatorias robustas con longitud y conjuntos de caracteres personalizados. Se ejecuta por completo en tu navegador.',
  'Free online PDF tools. Merge multiple PDFs into one, or extract a page range into a new file. Runs in your browser — files are never uploaded.':
    'Herramientas PDF online gratis. Une varios PDF en uno o extrae un rango de páginas a un archivo nuevo. Se ejecuta en tu navegador: los archivos nunca se suben.',
  'e.g. 1-3,5,7-9': 'p. ej. 1-3,5,7-9',
  'Free QR code generator. Turn any text or URL into a downloadable PNG QR code. Runs entirely in your browser.':
    'Generador de códigos QR gratis. Convierte cualquier texto o URL en un código QR PNG descargable. Se ejecuta por completo en tu navegador.',
  'Generate': 'Generar',
  'Free online regex tester. Test regular expressions with live match highlighting, capture groups, flags and replace preview.':
    'Probador de expresiones regulares online gratis. Prueba regex con resaltado de coincidencias en vivo, grupos de captura, opciones y vista previa de reemplazo.',
  'e.g. \\d{4}-\\d{2}-\\d{2}': 'p. ej. \\d{4}-\\d{2}-\\d{2}',
  'URL': 'URL',
  'Replacement — use $1, $2 …': 'Reemplazo — usa $1, $2 …',
  'Convert Unix timestamps to human dates and back. Supports seconds and milliseconds, local time, UTC and ISO 8601. Free and instant.':
    'Convierte marcas de tiempo Unix a fechas legibles y viceversa. Compatible con segundos y milisegundos, hora local, UTC e ISO 8601. Gratis e instantáneo.',
  'e.g. 1791500000': 'p. ej. 1791500000',
  'Free UUID v4 generator. Create one or thousands of random UUIDs, with uppercase, no-dash and brace formats. Runs in your browser.':
    'Generador de UUID v4 gratis. Crea uno o miles de UUID aleatorios, con formatos en mayúsculas, sin guiones y con llaves. Se ejecuta en tu navegador.',
  'Free online word counter. Count words, characters, sentences and paragraphs, estimate reading time, and see the most frequent words.':
    'Contador de palabras online gratis. Cuenta palabras, caracteres, frases y párrafos, estima el tiempo de lectura y muestra las palabras más frecuentes.',
  'Your text': 'Tu texto',
  'Paste or type your text here…': 'Pega o escribe aquí tu texto…',

  /* ---- 通用 ---- */
  'Copy': 'Copiar',
  'Copied!': '¡Copiado!',
  'Result': 'Resultado',
  'Email': 'Correo',
  'Input text': 'Texto de entrada',
  'Output format': 'Formato de salida',
  '—': '—',

  /* ---- 单位名 ---- */
  units: {
    length: ['Metro (m)', 'Kilómetro (km)', 'Centímetro (cm)', 'Milímetro (mm)', 'Milla (mi)', 'Yarda (yd)', 'Pie (ft)', 'Pulgada (in)', 'Milla náutica (nmi)'],
    weight: ['Kilogramo (kg)', 'Gramo (g)', 'Miligramo (mg)', 'Tonelada métrica (t)', 'Libra (lb)', 'Onza (oz)', 'Stone (st)'],
    area:   ['Metro cuadrado (m²)', 'Kilómetro cuadrado (km²)', 'Centímetro cuadrado (cm²)', 'Hectárea (ha)', 'Acre (ac)', 'Pie cuadrado (ft²)', 'Pulgada cuadrada (in²)', 'Milla cuadrada (mi²)'],
    volume: ['Litro (L)', 'Mililitro (mL)', 'Metro cúbico (m³)', 'Galón estadounidense (gal)', 'Cuarto estadounidense (qt)', 'Pinta estadounidense (pt)', 'Taza estadounidense', 'Onza líquida estadounidense (fl oz)', 'Galón británico (gal UK)'],
    speed:  ['Metro/segundo (m/s)', 'Kilómetro/hora (km/h)', 'Milla/hora (mph)', 'Nudo (kn)', 'Pie/segundo (ft/s)'],
    time:   ['Segundo (s)', 'Milisegundo (ms)', 'Minuto (min)', 'Hora (h)', 'Día (d)', 'Semana (wk)', 'Mes (30 d)', 'Año (365 d)'],
    data:   ['Byte (B)', 'Bit (b)', 'Kilobyte (KB)', 'Megabyte (MB)', 'Gigabyte (GB)', 'Terabyte (TB)'],
    temperature: ['Celsius (°C)', 'Fahrenheit (°F)', 'Kelvin (K)']
  }
};

/* ------------------------------ Русский ------------------------------ */
I18N.ru = {

  /* ---- 外壳 ---- */
  'Home': 'Главная',
  'Privacy': 'Конфиденциальность',
  'Privacy Policy': 'Политика конфиденциальности',
  'Tools': 'Инструменты',
  'Language': 'Язык',
  'Converters': 'Конвертеры',
  'Generators': 'Генераторы',
  'Text & Code': 'Текст и код',
  'Files & Media': 'Файлы и медиа',
  'Calculators': 'Калькуляторы',

  /* ---- 导航工具名 ---- */
  'Unit Converter': 'Конвертер единиц',
  'Currency Converter': 'Конвертер валют',
  'Timestamp Converter': 'Конвертер меток времени',
  'Color Converter': 'Конвертер цветов',
  'Case Converter': 'Конвертер регистра',
  'Password Generator': 'Генератор паролей',
  'UUID Generator': 'Генератор UUID',
  'QR Code Generator': 'Генератор QR-кодов',
  'JSON Formatter': 'Форматирование JSON',
  'Base64 Encoder': 'Кодирование Base64',
  'Regex Tester': 'Тестер регулярных выражений',
  'Word Counter': 'Счётчик слов',
  'Image Compressor': 'Сжатие изображений',
  'PDF Merge / Split': 'Объединение / разделение PDF',
  'Mortgage Calculator': 'Ипотечный калькулятор',
  'Date Calculator': 'Калькулятор дат',

  /* ---- 广告位 ---- */
  'Ad slot — 728x90 / responsive': 'Рекламный блок — 728x90 / адаптивный',
  'Ad slot — 300x250': 'Рекламный блок — 300x250',

  /* ---- 页脚 ---- */
  '© 2026 Toolbox. All tools run locally in your browser.': '© 2026 Toolbox. Все инструменты работают локально в вашем браузере.',
  '© 2026 Toolbox. Estimates only — not financial advice.': '© 2026 Toolbox. Только оценки — это не финансовая консультация.',
  '© 2026 Toolbox. Generated locally with Web Crypto.': '© 2026 Toolbox. Сгенерировано локально с помощью Web Crypto.',
  '© 2026 Toolbox. Generated with Web Crypto.': '© 2026 Toolbox. Сгенерировано с помощью Web Crypto.',
  '© 2026 Toolbox. Images never leave your browser.': '© 2026 Toolbox. Изображения не покидают ваш браузер.',
  '© 2026 Toolbox. Powered by pdf-lib, running locally.': '© 2026 Toolbox. На основе pdf-lib, работает локально.',
  '© 2026 Toolbox. QR encoding uses a compact built-in renderer.': '© 2026 Toolbox. Кодирование QR выполняется встроенным компактным генератором.',
  '© 2026 Toolbox. Rates from open exchange-rate API.': '© 2026 Toolbox. Курсы берутся из открытого API.',

  /* ---- 首页 ---- */
  'Free tools that just work': 'Бесплатные инструменты, которые просто работают',
  'Fast, private, browser-based utilities. No signup, no upload — everything runs on your device.':
    'Быстрые и приватные утилиты прямо в браузере. Без регистрации и загрузок — всё работает на вашем устройстве.',
  'Length, weight, temperature, area, volume, speed, time and data storage.':
    'Длина, вес, температура, площадь, объём, скорость, время и объём данных.',
  'Convert between 30+ currencies with live exchange rates.': 'Перевод между 30+ валютами по актуальным курсам.',
  'Unix epoch ↔ date, in seconds or milliseconds, local and UTC.': 'Unix-время ↔ дата, в секундах или миллисекундах, локальное время и UTC.',
  'UPPER, lower, Title, camelCase, snake_case, kebab-case and more.': 'ВЕРХНИЙ, нижний, Заголовочный, camelCase, snake_case, kebab-case и другие.',
  'HEX ↔ RGB ↔ HSL. Pick and preview colors instantly.': 'HEX ↔ RGB ↔ HSL. Выбор и мгновенный предпросмотр цвета.',
  'Strong random passwords with a strength meter. Never leaves your browser.': 'Надёжные случайные пароли с индикатором стойкости. Не покидают ваш браузер.',
  'Random UUID v4 values in bulk, with uppercase and no-dash options.': 'Случайные UUID v4 пачками, с опциями верхнего регистра и без дефисов.',
  'Turn any text or URL into a downloadable QR code image.': 'Превратите любой текст или ссылку в QR-код для скачивания.',
  'Pretty-print, minify, sort keys and validate JSON with line numbers.': 'Форматирование, минификация, сортировка ключей и проверка JSON с номерами строк.',
  'Encode or decode text and files. URL-safe variant and Data URI output.': 'Кодирование и декодирование текста и файлов. URL-safe вариант и вывод Data URI.',
  'Live match highlighting, capture groups and replace preview.': 'Подсветка совпадений в реальном времени, группы захвата и предпросмотр замены.',
  'Words, characters, sentences, reading time and top words.': 'Слова, символы, предложения, время чтения и частые слова.',
  'Shrink and resize JPG, PNG and WebP without uploading.': 'Сжатие и изменение размера JPG, PNG и WebP без загрузки на сервер.',
  'Combine several PDFs or extract a page range into a new file.': 'Объединяйте несколько PDF или извлекайте диапазон страниц в новый файл.',
  'Monthly payment, total interest and a year-by-year amortization table.': 'Ежемесячный платёж, общая сумма процентов и график платежей по годам.',
  'Days between dates, date arithmetic and exact age.': 'Дней между датами, арифметика дат и точный возраст.',
  'Why Toolbox': 'Почему Toolbox',
  'Every tool runs entirely in your browser with plain JavaScript — nothing is sent to a server. That means it loads instantly, works offline, and keeps your data private. Bookmark any tool and use it any time.':
    'Каждый инструмент целиком работает в вашем браузере на чистом JavaScript — на сервер ничего не отправляется. Поэтому он загружается мгновенно, работает офлайн и сохраняет ваши данные приватными. Добавьте любой инструмент в закладки и пользуйтесь в любое время.',

  /* ---- 隐私政策 ---- */
  'Last updated: October 7, 2026': 'Последнее обновление: 7 октября 2026 г.',
  '1. What we collect': '1. Что мы собираем',
  '2. Files you open': '2. Файлы, которые вы открываете',
  '3. Cookies and third-party advertising': '3. Cookie и сторонняя реклама',
  '4. Server logs': '4. Серверные логи',
  '5. Children': '5. Дети',
  '6. Your rights': '6. Ваши права',
  '7. Changes': '7. Изменения',
  '8. Contact': '8. Контакты',
  'Nothing. Toolbox has no accounts, no sign-up and no server-side storage. Every tool on this site is a plain HTML/CSS/JavaScript page that executes entirely inside your browser. The text you type, the files you pick and the values you calculate are processed on your device and are never transmitted to us.':
    'Ничего. В Toolbox нет учётных записей, регистрации и серверного хранилища. Каждый инструмент на сайте — обычная страница HTML/CSS/JavaScript, которая выполняется целиком внутри вашего браузера. Введённый текст, выбранные файлы и рассчитанные значения обрабатываются на вашем устройстве и никогда нам не передаются.',
  'Tools such as the Image Compressor, PDF Merge / Split and Base64 Encoder read files through the browser\'s local File API. Those files stay in your browser\'s memory. They are not uploaded, and closing the tab discards them.':
    'Такие инструменты, как сжатие изображений, объединение и разделение PDF и кодирование Base64, читают файлы через локальный File API браузера. Эти файлы остаются в памяти браузера. Они не загружаются на сервер, а при закрытии вкладки удаляются.',
  'We do not set cookies for our own purposes. This site is supported by advertising, and the advertising partners we work with may set cookies or read device identifiers in order to serve and measure ads.':
    'Мы не устанавливаем cookie для собственных целей. Сайт существует за счёт рекламы, и наши рекламные партнёры могут устанавливать cookie или считывать идентификаторы устройства, чтобы показывать и измерять рекламу.',
  'Third-party vendors, including Google, may use cookies to serve ads based on your prior visits to this site or to other sites. Google\'s use of advertising cookies enables it and its partners to serve ads to you based on your visit to this site and/or other sites on the internet.':
    'Сторонние поставщики, включая Google, могут использовать cookie для показа рекламы на основе ваших предыдущих посещений этого или других сайтов. Использование Google рекламных cookie позволяет ему и его партнёрам показывать вам рекламу на основе вашего посещения этого сайта и/или других сайтов в интернете.',
  'You can opt out of personalised advertising by visiting': 'Отказаться от персонализированной рекламы можно на странице',
  'Google Ads Settings': 'Настройки рекламы Google',
  ', or opt out of third-party vendor cookies for personalised advertising at':
    ', либо отключить cookie сторонних поставщиков для персонализированной рекламы на',
  '. If you are in the European Economic Area, the United Kingdom or Switzerland, you will be asked for consent before any personalised advertising cookie is set, and you may withdraw that consent at any time.':
    '. Если вы находитесь в Европейской экономической зоне, Великобритании или Швейцарии, перед установкой любого cookie для персонализированной рекламы у вас запросят согласие, и вы можете отозвать его в любой момент.',
  'Like any website, our hosting provider may record standard request logs — IP address, user agent, requested path and timestamp — for security and abuse prevention. These logs are not linked to any information you enter into a tool.':
    'Как и любой сайт, наш хостинг-провайдер может вести стандартные журналы запросов — IP-адрес, user agent, запрошенный путь и метка времени — для безопасности и предотвращения злоупотреблений. Эти журналы не связаны с какой-либо информацией, которую вы вводите в инструмент.',
  'This site is not directed at children under 13, and we do not knowingly collect personal information from them.':
    'Этот сайт не предназначен для детей младше 13 лет, и мы сознательно не собираем их персональные данные.',
  'Because we hold no personal data about you, there is nothing for us to export, correct or delete. Requests concerning advertising data should be directed to the relevant ad vendor using the opt-out links in section 3.':
    'Поскольку мы не храним ваши персональные данные, нам нечего экспортировать, исправлять или удалять. Запросы, касающиеся рекламных данных, следует направлять соответствующему рекламному партнёру по ссылкам отказа в разделе 3.',
  'If this policy changes, the revised version will be posted on this page with an updated date.':
    'Если эта политика изменится, обновлённая версия будет опубликована на этой странице с новой датой.',
  'Questions about this policy:': 'Вопросы по этой политике:',

  /* ---- 单位换算 ---- */
  'Convert between common units of length, weight, temperature, area, volume and speed.':
    'Перевод между распространёнными единицами длины, веса, температуры, площади, объёма и скорости.',
  'Category': 'Категория',
  'Value': 'Значение',
  'From': 'Из',
  'To': 'В',
  '⇆ Swap units': '⇆ Поменять единицы',
  'Copy result': 'Копировать результат',
  'Length': 'Длина',
  'Weight / Mass': 'Вес / Масса',
  'Temperature': 'Температура',
  'Area': 'Площадь',
  'Volume': 'Объём',
  'Speed': 'Скорость',
  'Time': 'Время',
  'Digital Storage': 'Объём данных',

  /* ---- 汇率换算 ---- */
  'Convert between 30+ currencies using live exchange rates.': 'Перевод между 30+ валютами по актуальным курсам.',
  'Amount': 'Сумма',
  '⇆ Swap': '⇆ Поменять',
  'Refresh rates': 'Обновить курсы',
  'Popular conversions': 'Популярные переводы',
  'Fetching live rates…': 'Получение актуальных курсов…',
  'Refreshing…': 'Обновление…',
  'Live rates · updated {t}': 'Актуальные курсы · обновлено {t}',
  'Offline — using built-in fallback rates': 'Офлайн — используются встроенные резервные курсы',
  '1 {a} = {b} {c} · live rates': '1 {a} = {b} {c} · актуальные курсы',

  /* ---- 时间戳 ---- */
  'Unix Timestamp Converter': 'Конвертер Unix-времени',
  'Unix Timestamp Converter — Epoch to Date': 'Конвертер Unix-времени — из эпохи в дату',
  'Paste a timestamp to get a date, or pick a date to get its timestamp. Seconds and milliseconds auto-detected.':
    'Вставьте метку времени, чтобы получить дату, или выберите дату, чтобы получить её метку. Секунды и миллисекунды определяются автоматически.',
  'Unix timestamp': 'Unix-время',
  'Date & time (local)': 'Дата и время (локальные)',
  'Timestamp → Date': 'Метка времени → Дата',
  'Date → Timestamp': 'Дата → Метка времени',
  'Use current time': 'Использовать текущее время',
  'Detected': 'Определено',
  'seconds': 'секунды',
  'milliseconds': 'миллисекунды',
  'Local': 'Локальное',
  'UTC': 'UTC',
  'ISO 8601': 'ISO 8601',
  'RFC 2822': 'RFC 2822',
  'Relative': 'Относительное',
  'Seconds': 'Секунды',
  'Milliseconds': 'Миллисекунды',
  'Invalid date': 'Некорректная дата',
  'Enter a valid number': 'Введите корректное число',
  'just now': 'только что',
  'Clear': 'Очистить',

  /* ---- 颜色转换 ---- */
  'Color Converter — HEX, RGB, HSL': 'Конвертер цветов — HEX, RGB, HSL',
  'Convert HEX ↔ RGB ↔ HSL with a live preview. Pick a color or type a value.':
    'Перевод HEX ↔ RGB ↔ HSL с живым предпросмотром. Выберите цвет или введите значение.',
  'HEX': 'HEX',
  'RGB': 'RGB',
  'HSL': 'HSL',
  'Hex color': 'Цвет HEX',
  'Pick a color': 'Выберите цвет',
  'Random color': 'Случайный цвет',
  'Copy HEX': 'Копировать HEX',
  'Copy RGB': 'Копировать RGB',
  'Copy HSL': 'Копировать HSL',

  /* ---- 大小写转换 ---- */
  'Case Converter — UPPER, lower, camelCase, snake_case': 'Конвертер регистра — ВЕРХНИЙ, нижний, camelCase, snake_case',
  'Type once, get every naming style at the same time — including camelCase and snake_case for code.':
    'Введите один раз и получите все стили именования сразу — включая camelCase и snake_case для кода.',
  'Title Case': 'Заголовочный регистр',
  'Sentence case': 'Регистр предложения',

  /* ---- 密码生成 ---- */
  'Password Generator — Strong Random Passwords': 'Генератор паролей — надёжные случайные пароли',
  'Generate strong passwords with a cryptographically secure random source. Nothing is sent anywhere.':
    'Создавайте надёжные пароли с криптографически стойким источником случайности. Ничего никуда не отправляется.',
  'Generated password': 'Сгенерированный пароль',
  'Length:': 'Длина:',
  'Uppercase (A-Z)': 'Прописные (A-Z)',
  'Lowercase (a-z)': 'Строчные (a-z)',
  'Numbers (0-9)': 'Цифры (0-9)',
  'Symbols (!@#$…)': 'Символы (!@#$…)',
  'Avoid ambiguous (0 O o 1 l I |)': 'Исключить похожие символы (0 O o 1 l I |)',
  'Quick presets': 'Быстрые пресеты',
  '↻ Generate': '↻ Сгенерировать',
  'Weak': 'Слабый',
  'Fair': 'Средний',
  'Strong': 'Надёжный',
  'Very strong': 'Очень надёжный',
  '{label} · ~{bits} bits of entropy': '{label} · ~{bits} бит энтропии',

  /* ---- UUID ---- */
  'UUID Generator — Random v4 UUIDs': 'Генератор UUID — случайные UUID v4',
  'Generate cryptographically random UUID v4 values, one at a time or in bulk.':
    'Генерация криптографически случайных UUID v4 — по одному или пачкой.',
  'How many': 'Сколько',
  'Uppercase': 'Верхний регистр',
  'No dashes': 'Без дефисов',
  'Braces {}': 'Фигурные скобки {}',
  'Copy all': 'Копировать всё',
  'Download .txt': 'Скачать .txt',

  /* ---- 二维码 ---- */
  'QR Code Generator — Text & URL to QR': 'Генератор QR-кодов — текст и ссылки в QR',
  'Type any text or URL and download it as a QR code image. Everything happens in your browser.':
    'Введите любой текст или ссылку и скачайте результат как изображение QR-кода. Всё происходит в вашем браузере.',
  'Text or URL': 'Текст или ссылка',
  'Size:': 'Размер:',
  'Error correction': 'Коррекция ошибок',
  'QR preview': 'Предпросмотр QR',
  'Download PNG': 'Скачать PNG',
  'L — 7%': 'L — 7%',
  'M — 15%': 'M — 15%',
  'Q — 25%': 'Q — 25%',
  'H — 30%': 'H — 30%',
  'Text too long for this build (max v10). Shorten it.': 'Текст слишком длинный для этой сборки (максимум v10). Сократите его.',

  /* ---- JSON ---- */
  'JSON Formatter & Validator': 'Форматирование и проверка JSON',
  'JSON Formatter & Validator — Pretty Print, Minify': 'Форматирование и проверка JSON — отступы, минификация',
  'Pretty-print, minify and validate JSON. Errors are reported with line and column.':
    'Форматирование, минификация и проверка JSON. Ошибки указываются с номером строки и столбца.',
  'JSON input': 'Ввод JSON',
  'Indent': 'Отступ',
  'Sort keys alphabetically': 'Сортировать ключи по алфавиту',
  'Format': 'Форматировать',
  'Minify': 'Минифицировать',
  '1 space': '1 пробел',
  '2 spaces': '2 пробела',
  '4 spaces': '4 пробела',
  'Tab-less (compact)': 'Без отступов (компактно)',
  'Invalid JSON': 'Некорректный JSON',
  '(line {l}, col {c})': '(строка {l}, столбец {c})',
  'Valid JSON · {k} keys · depth {d} · {b} bytes': 'Корректный JSON · {k} ключей · глубина {d} · {b} байт',
  'Unexpected end of input — expected a value': 'Неожиданный конец ввода — ожидалось значение',
  'Unexpected end of input — the array is not closed': 'Неожиданный конец ввода — массив не закрыт',
  'Unexpected end of input — the object is not closed': 'Неожиданный конец ввода — объект не закрыт',
  'Unexpected end of input — expected \':\'': 'Неожиданный конец ввода — ожидалось \':\'',
  'Unexpected token \'{c}\' — expected a value': 'Неожиданный символ \'{c}\' — ожидалось значение',
  'Unexpected token \'{c}\' after the JSON value': 'Неожиданный символ \'{c}\' после значения JSON',
  'Expected \',\' or \']\' but found \'{c}\'': 'Ожидалось \',\' или \']\', но найдено \'{c}\'',
  'Expected \',\' or \'}\' but found \'{c}\'': 'Ожидалось \',\' или \'}\', но найдено \'{c}\'',
  'Expected a double-quoted property name but found \'{c}\'': 'Ожидалось имя свойства в двойных кавычках, но найдено \'{c}\'',
  'Expected \':\' after the property name but found \'{c}\'': 'После имени свойства ожидалось \':\', но найдено \'{c}\'',
  'Trailing comma is not allowed in JSON': 'Завершающая запятая в JSON недопустима',
  'Unterminated string': 'Незакрытая строка',
  'Invalid number': 'Некорректное число',
  'Invalid number — expected a digit after the decimal point': 'Некорректное число — после десятичной точки нужна цифра',
  'Invalid number — expected a digit in the exponent': 'Некорректное число — в экспоненте нужна цифра',
  'Control character in string — it must be escaped': 'Управляющий символ в строке — его нужно экранировать',
  'Invalid escape \'\\{c}\'': 'Некорректная escape-последовательность \'\\{c}\'',
  'Invalid \\u escape — expected 4 hex digits': 'Некорректная \\u-последовательность — нужно 4 шестнадцатеричные цифры',
  'Empty input': 'Пустой ввод',

  /* ---- Base64 ---- */
  'Base64 Encoder / Decoder': 'Кодирование и декодирование Base64',
  'Base64 Encoder / Decoder — Text & File': 'Кодирование и декодирование Base64 — текст и файлы',
  'Encode or decode text and files. Everything happens locally — nothing is uploaded.':
    'Кодируйте и декодируйте текст и файлы. Всё происходит локально — ничего не загружается.',
  'Input': 'Ввод',
  'Output': 'Вывод',
  'Encode →': 'Кодировать →',
  '← Decode': '← Декодировать',
  '⇆ Swap': '⇆ Поменять',
  'Copy result': 'Копировать результат',
  'File → Base64': 'Файл → Base64',
  'Pick a file to get its Base64 / Data URI. Handy for embedding images in CSS or HTML.':
    'Выберите файл, чтобы получить его Base64 / Data URI. Удобно для встраивания изображений в CSS или HTML.',
  'Input does not look like valid Base64': 'Ввод не похож на корректный Base64',
  'Decoded OK': 'Декодировано успешно',
  'Decode failed: invalid Base64': 'Ошибка декодирования: некорректный Base64',
  'Encode failed: {msg}': 'Ошибка кодирования: {msg}',
  'Encoded {a} chars → {b} chars': 'Закодировано {a} символов → {b} символов',
  'File encoded to Data URI': 'Файл закодирован в Data URI',
  'File read failed': 'Не удалось прочитать файл',

  /* ---- 正则 ---- */
  'Regex Tester — Test Regular Expressions Online': 'Тестер регулярных выражений — проверка онлайн',
  'Test a regular expression against your text with live highlighting, groups and replace preview.':
    'Проверяйте регулярное выражение на своём тексте с живой подсветкой, группами и предпросмотром замены.',
  'Regular expression': 'Регулярное выражение',
  'Test text': 'Тестовый текст',
  'Flags': 'Флаги',
  'g — global': 'g — глобальный поиск',
  'i — ignore case': 'i — игнорировать регистр',
  'm — multiline': 'm — многострочный',
  's — dotall': 's — точка как любой символ',
  'u — unicode': 'u — unicode',
  'y — sticky': 'y — привязка к позиции',
  'Highlighted matches': 'Подсвеченные совпадения',
  'Capture groups': 'Группы захвата',
  'Replace preview': 'Предпросмотр замены',
  'No matches': 'Совпадений нет',
  'No text': 'Нет текста',
  'no groups': 'нет групп',
  'Invalid regex: {msg}': 'Некорректное выражение: {msg}',
  '{n} matches': 'Совпадений: {n}',
  '{n} match': 'Совпадений: {n}',
  '{n} · flags: {f}': '{n} · флаги: {f}',
  '…and {n} more': '…и ещё {n}',
  'undefined': 'не определено',

  /* ---- 字数统计 ---- */
  'Word Counter — Characters, Words, Reading Time': 'Счётчик слов — символы, слова, время чтения',
  'Live word, character and sentence counts with reading time. Handles English and Chinese text.':
    'Подсчёт слов, символов и предложений в реальном времени со временем чтения. Поддерживает английский и китайский текст.',
  'Statistics': 'Статистика',
  'Words': 'Слова',
  'Characters': 'Символы',
  'Characters (no spaces)': 'Символы (без пробелов)',
  'Letters': 'Буквы',
  'Digits': 'Цифры',
  'Sentences': 'Предложения',
  'Paragraphs': 'Абзацы',
  'Lines': 'Строки',
  'Blank lines': 'Пустые строки',
  'Reading time': 'Время чтения',
  'Speaking time': 'Время произнесения',
  'Most frequent words': 'Самые частые слова',
  'Repeated word': 'Повторяющееся слово',
  'No repeated words yet': 'Повторяющихся слов пока нет',
  'Copy stats': 'Копировать статистику',
  '{n} sec': '{n} с',
  '{n} min': '{n} мин',
  'Words: {w}\nCharacters: {c}\nCharacters (no spaces): {cs}\nSentences: {s}\nParagraphs: {p}':
    'Слова: {w}\nСимволы: {c}\nСимволы (без пробелов): {cs}\nПредложения: {s}\nАбзацы: {p}',

  /* ---- 图片压缩 ---- */
  'Image Compressor — Reduce JPG, PNG, WebP Size Online': 'Сжатие изображений — уменьшение JPG, PNG, WebP онлайн',
  'Shrink and resize images without uploading them anywhere. Everything stays on your device.':
    'Сжимайте и масштабируйте изображения, никуда их не загружая. Всё остаётся на вашем устройстве.',
  'Drop an image here': 'Перетащите изображение сюда',
  'or click to choose': 'или нажмите, чтобы выбрать',
  'JPG · PNG · WebP · GIF (first frame)': 'JPG · PNG · WebP · GIF (первый кадр)',
  'Quality:': 'Качество:',
  'Max width (px)': 'Макс. ширина (px)',
  'JPEG — smallest, no transparency': 'JPEG — самый маленький, без прозрачности',
  'PNG — lossless, keeps transparency': 'PNG — без потерь, сохраняет прозрачность',
  'WebP — smaller, modern browsers': 'WebP — меньше размер, современные браузеры',
  'Compress': 'Сжать',
  'Compressing…': 'Сжатие…',
  'Pick an image first': 'Сначала выберите изображение',
  'Pick an image to begin': 'Выберите изображение, чтобы начать',
  'Download': 'Скачать',
  'Original': 'Оригинал',
  'Output': 'Результат',
  'Saved': 'Экономия',
  'Format': 'Формат',
  'px': 'px',
  'Cannot read image': 'Не удалось прочитать изображение',

  /* ---- PDF ---- */
  'PDF Merge & Split': 'Объединение и разделение PDF',
  'PDF Merge & Split — Combine or Extract PDF Pages Free': 'Объединение и разделение PDF — бесплатно',
  'Combine several PDFs, or pull out a page range. Files are processed locally and never uploaded.':
    'Объединяйте несколько PDF или извлекайте диапазон страниц. Файлы обрабатываются локально и никогда не загружаются.',
  'Merge PDFs': 'Объединить PDF',
  'Split / Extract pages': 'Разделить / извлечь страницы',
  'Drop PDF files here': 'Перетащите PDF-файлы сюда',
  'or click to choose (2 or more)': 'или нажмите, чтобы выбрать (2 и более)',
  'PDF file': 'PDF-файл',
  'Page range': 'Диапазон страниц',
  'Use commas for separate pages and dashes for ranges.': 'Отдельные страницы — через запятую, диапазоны — через дефис.',
  'Extract pages': 'Извлечь страницы',
  'No files selected': 'Файлы не выбраны',
  'Merging…': 'Объединение…',
  'Extracting…': 'Извлечение…',
  'Select at least 2 PDF files': 'Выберите минимум 2 PDF-файла',
  'Select a PDF to split': 'Выберите PDF для разделения',
  'Merge failed: {msg}': 'Ошибка объединения: {msg}',
  'Split failed: {msg}': 'Ошибка разделения: {msg}',
  'Merged {n} files → {p} pages · {size}': 'Объединено файлов: {n} → страниц: {p} · {size}',
  'Extracted {n} of {t} pages · {size}': 'Извлечено {n} из {t} страниц · {size}',
  'No valid pages. This PDF has {n} pages.': 'Нет допустимых страниц. В этом PDF {n} страниц.',

  /* ---- 房贷 ---- */
  'Mortgage Calculator — Monthly Payment & Amortization': 'Ипотечный калькулятор — платёж и график',
  'Work out monthly payments, total interest and a full amortization schedule.':
    'Рассчитайте ежемесячный платёж, общую сумму процентов и полный график платежей.',
  'Loan amount': 'Сумма кредита',
  'Annual interest rate (%)': 'Годовая ставка (%)',
  'Term (years)': 'Срок (лет)',
  'Repayment type': 'Тип платежей',
  'Equal payments (amortizing)': 'Аннуитетные платежи',
  'Equal principal (linear)': 'Дифференцированные платежи',
  'Show amortization': 'Показать график',
  'Hide amortization': 'Скрыть график',
  'Monthly payment': 'Ежемесячный платёж',
  'First payment': 'Первый платёж',
  'Last payment': 'Последний платёж',
  'Total interest': 'Всего процентов',
  'Total paid': 'Всего выплачено',
  'Interest / principal': 'Проценты / основной долг',
  'Payments': 'Платежей',
  'Year': 'Год',
  'Principal / Interest / Balance': 'Долг / Проценты / Остаток',
  'Enter a loan amount': 'Введите сумму кредита',
  '{n} months': '{n} мес.',

  /* ---- 日期计算 ---- */
  'Date Calculator — Days Between Dates, Add Days, Age': 'Калькулятор дат — дней между датами, прибавление, возраст',
  'Days between dates, date arithmetic, and exact age — all in one page.':
    'Дней между датами, арифметика дат и точный возраст — всё на одной странице.',
  'Days between two dates': 'Дней между двумя датами',
  'Add / subtract from a date': 'Прибавить / вычесть к дате',
  'Age calculator': 'Калькулятор возраста',
  'Date': 'Дата',
  'Start date': 'Начальная дата',
  'Date of birth': 'Дата рождения',
  'Years': 'Годы',
  'Months': 'Месяцы',
  'Days': 'Дни',
  'Pick two dates': 'Выберите две даты',
  'Pick a start date': 'Выберите начальную дату',
  'Pick a birth date': 'Выберите дату рождения',
  'Total days': 'Всего дней',
  'Weeks + days': 'Недели + дни',
  'Years / Months / Days': 'Годы / Месяцы / Дни',
  'Hours': 'Часы',
  'Minutes': 'Минуты',
  'Result date': 'Полученная дата',
  'Weekday': 'День недели',
  'Leap year': 'Високосный год',
  'Yes': 'Да',
  'No': 'Нет',
  'Age': 'Возраст',
  'Days lived': 'Прожито дней',
  'Next birthday in': 'До следующего дня рождения',
  '{d} days': '{d} дней',
  '{y} years {m} months {d} days': '{y} лет {m} мес. {d} дн.',
  '{y} y {m} m {d} d': '{y} г. {m} мес. {d} дн.',
  '{w} weeks {d} days': '{w} нед. {d} дн.',

  /* ---- 页面标题 / SEO 描述 ---- */
  'Toolbox — 16 Free Online Tools: Converters, Formatters, Calculators':
    'Toolbox — 16 бесплатных онлайн-инструментов: конвертеры, форматирование, калькуляторы',
  '16 free browser-based tools: unit and currency converter, password and UUID generator, QR code generator, JSON formatter, image compressor, PDF merge, regex tester, mortgage and date calculators and more. No signup, nothing uploaded.':
    '16 бесплатных инструментов прямо в браузере: конвертер единиц и валют, генератор паролей и UUID, генератор QR-кодов, форматирование JSON, сжатие изображений, объединение PDF, тестер регулярных выражений, ипотечный и датовый калькуляторы и другое. Без регистрации, без загрузки файлов.',
  'Privacy Policy — Toolbox': 'Политика конфиденциальности — Toolbox',
  'Privacy policy for Toolbox. Every tool runs locally in your browser; we do not collect, store or transmit the data you enter.':
    'Политика конфиденциальности Toolbox. Каждый инструмент работает локально в вашем браузере; мы не собираем, не храним и не передаём введённые вами данные.',
  'Unit Converter — Length, Weight, Temperature, Area, Speed': 'Конвертер единиц — длина, вес, температура, площадь, скорость',
  'Free online unit converter. Convert length, weight, temperature, area, volume and speed instantly in your browser.':
    'Бесплатный онлайн-конвертер единиц. Мгновенный перевод длины, веса, температуры, площади, объёма и скорости прямо в браузере.',
  'Currency Converter — Live Exchange Rates': 'Конвертер валют — актуальные курсы',
  'Free online currency converter with live exchange rates. Convert between USD, EUR, GBP, JPY, CNY and 30+ currencies.':
    'Бесплатный онлайн-конвертер валют с актуальными курсами. Перевод между USD, EUR, GBP, JPY, CNY и ещё 30+ валютами.',
  'Free Base64 encoder and decoder. Convert text or files to Base64 instantly in your browser. Supports URL-safe Base64 and Data URI output.':
    'Бесплатный кодировщик и декодировщик Base64. Мгновенно переводите текст или файлы в Base64 прямо в браузере. Поддерживается URL-safe Base64 и вывод Data URI.',
  'Type text to encode, or paste Base64 to decode…': 'Введите текст для кодирования или вставьте Base64 для декодирования…',
  'URL-safe variant (': 'URL-safe вариант (',
  ', no padding )': ' , без заполнения )',
  'Free case converter. Transform text to UPPERCASE, lowercase, Title Case, camelCase, PascalCase, snake_case, kebab-case and more, all at once.':
    'Бесплатный конвертер регистра. Преобразуйте текст в ВЕРХНИЙ, нижний, Заголовочный, camelCase, PascalCase, snake_case, kebab-case и другие — всё сразу.',
  'Type or paste text here…': 'Введите или вставьте текст здесь…',
  'Free color converter. Convert between HEX, RGB and HSL, with live preview. Instantly copy color codes.':
    'Бесплатный конвертер цветов. Перевод между HEX, RGB и HSL с живым предпросмотром. Мгновенное копирование кодов цвета.',
  'Free date calculator. Find days between two dates, add or subtract days/weeks/months, and calculate age precisely.':
    'Бесплатный калькулятор дат. Считайте дни между датами, прибавляйте и вычитайте дни/недели/месяцы и точно определяйте возраст.',
  'Free online image compressor. Shrink JPG, PNG and WebP files, resize and convert format. Nothing is uploaded — all processing happens in your browser.':
    'Бесплатное онлайн-сжатие изображений. Уменьшайте размер JPG, PNG и WebP, меняйте разрешение и формат. Ничего не загружается — всё обрабатывается в вашем браузере.',
  'Free online JSON formatter and validator. Pretty-print, minify, sort keys and check JSON syntax with line numbers. Runs in your browser.':
    'Бесплатное онлайн-форматирование и проверка JSON. Отступы, минификация, сортировка ключей и проверка синтаксиса с номерами строк. Работает в браузере.',
  'Free mortgage and loan calculator. Get your monthly payment, total interest and a year-by-year amortization schedule.':
    'Бесплатный ипотечный и кредитный калькулятор. Ежемесячный платёж, общая сумма процентов и график платежей по годам.',
  'Free secure password generator. Create strong random passwords with custom length and character sets. Runs entirely in your browser.':
    'Бесплатный генератор надёжных паролей. Создавайте стойкие случайные пароли с заданной длиной и наборами символов. Полностью работает в вашем браузере.',
  'Free online PDF tools. Merge multiple PDFs into one, or extract a page range into a new file. Runs in your browser — files are never uploaded.':
    'Бесплатные онлайн-инструменты для PDF. Объединяйте несколько PDF в один или извлекайте диапазон страниц в новый файл. Работает в браузере — файлы никогда не загружаются.',
  'e.g. 1-3,5,7-9': 'напр. 1-3,5,7-9',
  'Free QR code generator. Turn any text or URL into a downloadable PNG QR code. Runs entirely in your browser.':
    'Бесплатный генератор QR-кодов. Превратите любой текст или ссылку в QR-код PNG для скачивания. Полностью работает в вашем браузере.',
  'Generate': 'Сгенерировать',
  'Free online regex tester. Test regular expressions with live match highlighting, capture groups, flags and replace preview.':
    'Бесплатный онлайн-тестер регулярных выражений. Проверка с живой подсветкой совпадений, группами захвата, флагами и предпросмотром замены.',
  'e.g. \\d{4}-\\d{2}-\\d{2}': 'напр. \\d{4}-\\d{2}-\\d{2}',
  'URL': 'URL',
  'Replacement — use $1, $2 …': 'Замена — используйте $1, $2 …',
  'Convert Unix timestamps to human dates and back. Supports seconds and milliseconds, local time, UTC and ISO 8601. Free and instant.':
    'Перевод Unix-времени в читаемые даты и обратно. Поддержка секунд и миллисекунд, локального времени, UTC и ISO 8601. Бесплатно и мгновенно.',
  'e.g. 1791500000': 'напр. 1791500000',
  'Free UUID v4 generator. Create one or thousands of random UUIDs, with uppercase, no-dash and brace formats. Runs in your browser.':
    'Бесплатный генератор UUID v4. Создавайте один или тысячи случайных UUID, с форматами в верхнем регистре, без дефисов и в фигурных скобках. Работает в браузере.',
  'Free online word counter. Count words, characters, sentences and paragraphs, estimate reading time, and see the most frequent words.':
    'Бесплатный онлайн-счётчик слов. Считает слова, символы, предложения и абзацы, оценивает время чтения и показывает самые частые слова.',
  'Your text': 'Ваш текст',
  'Paste or type your text here…': 'Вставьте или введите текст здесь…',

  /* ---- 通用 ---- */
  'Copy': 'Копировать',
  'Copied!': 'Скопировано!',
  'Result': 'Результат',
  'Email': 'Почта',
  'Input text': 'Входной текст',
  'Output format': 'Формат вывода',
  '—': '—',

  /* ---- 单位名 ---- */
  units: {
    length: ['Метр (m)', 'Километр (km)', 'Сантиметр (cm)', 'Миллиметр (mm)', 'Миля (mi)', 'Ярд (yd)', 'Фут (ft)', 'Дюйм (in)', 'Морская миля (nmi)'],
    weight: ['Килограмм (kg)', 'Грамм (g)', 'Миллиграмм (mg)', 'Метрическая тонна (t)', 'Фунт (lb)', 'Унция (oz)', 'Стоун (st)'],
    area:   ['Квадратный метр (m²)', 'Квадратный километр (km²)', 'Квадратный сантиметр (cm²)', 'Гектар (ha)', 'Акр (ac)', 'Квадратный фут (ft²)', 'Квадратный дюйм (in²)', 'Квадратная миля (mi²)'],
    volume: ['Литр (L)', 'Миллилитр (mL)', 'Кубический метр (m³)', 'Галлон США (gal)', 'Кварта США (qt)', 'Пинта США (pt)', 'Чашка США', 'Жидкая унция США (fl oz)', 'Галлон Великобритании (gal UK)'],
    speed:  ['Метр/секунду (m/s)', 'Километр/час (km/h)', 'Миля/час (mph)', 'Узел (kn)', 'Фут/секунду (ft/s)'],
    time:   ['Секунда (s)', 'Миллисекунда (ms)', 'Минута (min)', 'Час (h)', 'День (d)', 'Неделя (wk)', 'Месяц (30 дн.)', 'Год (365 дн.)'],
    data:   ['Байт (B)', 'Бит (b)', 'Килобайт (KB)', 'Мегабайт (MB)', 'Гигабайт (GB)', 'Терабайт (TB)'],
    temperature: ['Цельсий (°C)', 'Фаренгейт (°F)', 'Кельвин (K)']
  }
};

/* ==========================================================================
   引擎
   ========================================================================== */

let I18N_CURRENT = null;

function i18nDetect(){
  // 1. URL ?lang=
  let q = null;
  try { q = new URLSearchParams(location.search).get('lang'); } catch(e){}
  if (q && I18N_LANGS.indexOf(q) >= 0) return q;

  // 2. localStorage
  try {
    const s = localStorage.getItem(I18N_STORE);
    if (s && I18N_LANGS.indexOf(s) >= 0) return s;
  } catch(e){}

  // 3. 浏览器语言
  const list = (navigator.languages && navigator.languages.length)
    ? navigator.languages : [navigator.language || ''];
  for (const raw of list){
    const low = String(raw).toLowerCase();
    if (low.indexOf('zh') === 0) return 'zh';
    if (low.indexOf('ru') === 0) return 'ru';
    if (low.indexOf('es') === 0) return 'es';
    if (low.indexOf('en') === 0) return 'en';
  }
  return I18N_DEFAULT;
}

function i18nLang(){
  if (!I18N_CURRENT) I18N_CURRENT = i18nDetect();
  return I18N_CURRENT;
}
function i18nLocale(){ return I18N_LOCALES[i18nLang()] || 'en-US'; }

/** 翻译。key 就是英文原文；vars 里的键对应文案里的 {占位符}。 */
function t(key, vars){
  if (key === undefined || key === null) return '';
  const lang = i18nLang();
  let s = (lang !== 'en' && I18N[lang]) ? I18N[lang][key] : undefined;
  if (s === undefined && I18N.en) s = I18N.en[key];
  if (s === undefined) s = key;
  if (vars){
    s = String(s).replace(/\{(\w+)\}/g, (m, k) =>
      (vars[k] === undefined || vars[k] === null) ? m : String(vars[k]));
  }
  return s;
}

/** 单位显示名：按 UNITS 表里该类别的顺序取。idx 是单位在该类别里的序号。 */
function tUnit(category, idx, fallback){
  const lang = i18nLang();
  const pack = I18N[lang] && I18N[lang].units;
  const arr = pack && pack[category];
  if (arr && arr[idx] !== undefined) return arr[idx];
  return fallback;
}

/** 货币全名。用浏览器内置的 Intl.DisplayNames，不用维护 31×4 条词典。 */
function tCurrency(code){
  try {
    const dn = new Intl.DisplayNames([i18nLocale()], { type: 'currency' });
    const name = dn.of(code);
    if (name && name !== code) return name;
  } catch(e){}
  return (typeof CURRENCIES !== 'undefined' && CURRENCIES[code]) || code;
}

/** 数字按当前语言分组。 */
function tNum(n, opts){
  try { return Number(n).toLocaleString(i18nLocale(), opts); }
  catch(e){ return String(n); }
}

/** 相对时间，交给 Intl 处理俄语/西语的复数变化。 */
function tRelative(value, unit){
  try {
    return new Intl.RelativeTimeFormat(i18nLocale(), { numeric: 'auto' }).format(value, unit);
  } catch(e){ return String(value) + ' ' + unit; }
}

/* ---- 应用静态文案 ---- */
function applyI18n(root){
  root = root || document;

  const nodes = root.querySelectorAll('[data-i18n]');
  for (let i = 0; i < nodes.length; i++){
    const el = nodes[i];
    const v = t(el.getAttribute('data-i18n'));
    if (el.tagName === 'TITLE') document.title = v;
    el.textContent = v;
  }
  root.querySelectorAll('[data-i18n-ph]').forEach(el =>
    el.setAttribute('placeholder', t(el.getAttribute('data-i18n-ph'))));
  root.querySelectorAll('[data-i18n-title]').forEach(el =>
    el.setAttribute('title', t(el.getAttribute('data-i18n-title'))));
  root.querySelectorAll('[data-i18n-content]').forEach(el =>
    el.setAttribute('content', t(el.getAttribute('data-i18n-content'))));

  document.documentElement.lang = i18nLang();
  document.documentElement.removeAttribute('data-i18n-pending');
  document.dispatchEvent(new CustomEvent('i18n:changed', { detail: { lang: i18nLang() } }));
}

/* ---- hreflang：告诉搜索引擎这个页面有 4 个语言版本 ----
   用当前域名动态生成，所以换域名部署也不用改任何东西。
   （更彻底的 SEO 做法是把各语言输出成 /zh/ /es/ /ru/ 静态目录，
     那样不依赖 JS 也能被抓取；工具站流量起来之后值得做。） */
function installAlternates(){
  try {
    // 非浏览器环境（比如 Node 里跑测试）没有完整 DOM，直接跳过。
    if (!document.querySelector || !document.createElement || !document.head) return;
    if (document.querySelector('link[rel="alternate"][hreflang]')) return;
    const url = new URL(location.href);
    url.hash = '';
    for (const code of I18N_LANGS){
      url.searchParams.delete('lang');
      if (code !== I18N_DEFAULT) url.searchParams.set('lang', code);
      const l = document.createElement('link');
      l.rel = 'alternate';
      l.hreflang = code;
      l.href = url.toString();
      document.head.appendChild(l);
    }
    url.searchParams.delete('lang');
    const x = document.createElement('link');
    x.rel = 'alternate';
    x.hreflang = 'x-default';
    x.href = url.toString();
    document.head.appendChild(x);
  } catch(e){}
}

/** 切换语言：存 localStorage、同步 URL、整页重载。 */
function setLang(code){
  if (I18N_LANGS.indexOf(code) < 0 || code === i18nLang()) return;
  I18N_CURRENT = code;
  try { localStorage.setItem(I18N_STORE, code); } catch(e){}
  try {
    const url = new URL(location.href);
    if (code === I18N_DEFAULT) url.searchParams.delete('lang');
    else url.searchParams.set('lang', code);
    history.replaceState(null, '', url.toString());
  } catch(e){}
  location.reload();
}

/* ==========================================================================
   启动
   ========================================================================== */
(function(){
  const html = document.documentElement;
  html.lang = i18nLang();

  // 非英文时先藏住 body，避免"先闪一下英文再变中文"
  if (i18nLang() !== I18N_DEFAULT) html.setAttribute('data-i18n-pending', '');

  function ready(){
    try { installAlternates(); applyI18n(); }
    finally { html.removeAttribute('data-i18n-pending'); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();

  // 兜底：万一 applyI18n 抛错，也不能让页面一直藏着
  setTimeout(() => html.removeAttribute('data-i18n-pending'), 2000);
})();
