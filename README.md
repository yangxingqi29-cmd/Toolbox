# Toolbox — 免费在线工具站

静态多工具站，纯前端、无后端、可离线。**16 个工具 · 4 种语言** + 全站广告位 + 隐私政策页。

设计目标：**高搜索量关键词 × 强商业意图 × 零服务器成本**，方便接广告联盟（Monetag / Adsterra / AdSense）。

---

## 目录结构

```
toolbox/
├── index.html                  首页，16 张工具卡片，按 5 个分类分组
├── privacy.html                隐私政策（AdSense 过审必需）
├── robots.txt / sitemap.xml    SEO 收录（部署后替换域名）
├── css/style.css               全站样式（变量集中在 :root）
├── js/
│   ├── i18n.js                 ★ 多语言引擎 + 词典（English / 中文 / Español / Русский）
│   ├── nav.js                  全站导航 + 语言切换（改这一个文件，全站导航同步）
│   ├── units.js                单位换算（8 大类）
│   ├── currency.js             汇率换算（30+ 币种，实时 + 离线回退）
│   ├── timestamp.js            Unix 时间戳 ↔ 日期
│   ├── color.js                颜色转换 HEX/RGB/HSL
│   ├── case-converter.js       大小写 / 命名风格转换（12 种）
│   ├── password.js             密码生成（Web Crypto CSPRNG + 拒绝采样）
│   ├── uuid.js                 UUID v4 批量生成
│   ├── qrcode.js               QR 码生成（内嵌编码器，Canvas 渲染）
│   ├── json-formatter.js       JSON 格式化 / 压缩 / 校验（自研校验器，精确行列号）
│   ├── base64.js               Base64 编解码（UTF-8 安全、URL-safe、Data URI）
│   ├── regex-tester.js         正则测试（高亮、捕获组、替换预览）
│   ├── word-counter.js         字数统计（中英混排、阅读时长、词频）
│   ├── image-compressor.js     图片压缩 / 缩放（Canvas，纯本地）
│   ├── pdf-tools.js            PDF 合并 / 拆分（pdf-lib CDN）
│   ├── mortgage.js             房贷计算（等额本息 / 等额本金 + 摊销表）
│   └── date-calculator.js      日期计算（相差天数、日期加减、年龄）
├── tools/                      16 个工具页，每个 = 1 html + 1 js
├── scripts/
│   ├── i18n-tag.js             给静态 HTML 批量打 data-i18n 标记（幂等，可重跑）
│   ├── i18n-check.js           词典完整性检查：缺翻译 / 死条目
│   └── smoke.js                用 jsdom 真跑每个页面 × 每种语言
├── ads/slots.html              广告位清单 + 联盟代码接法
├── test.js                     105 条单测（node test.js）
└── test-qr.js                  QR 编码器结构测试（node test-qr.js）
```

---

## 多语言

支持 **English（源语言）/ 中文 / Español / Русский**。

### 怎么用

导航右侧的语言下拉（`EN / 中文 / ES / RU`）。选了之后：

- 存进 `localStorage`，下次打开还是这个语言
- 同时写进 URL（`?lang=zh`），方便分享和收录
- 首次访问按浏览器语言自动选（`navigator.languages`）
- 切换时整页重载 —— 保证每个工具的初始渲染都在新语言下重跑一遍

### 实现方式

**以英文原文作为 key。** 不需要给几百条文案起名字，漏翻也会优雅回退到英文：

```html
<h1 data-i18n="Unit Converter">Unit Converter</h1>
```

```js
I18N.zh = { 'Unit Converter': '单位换算', ... };
```

动态文案直接调 `t()`，占位符写 `{n}`：

```js
setStatus(t('Merged {n} files → {p} pages · {size}', { n, p, size }));
```

**能交给浏览器内置 API 的都不进词典：**

| 内容 | 方案 |
|---|---|
| 货币全名（31 种 × 4 语言） | `Intl.DisplayNames` |
| 相对时间（含俄语 1 год / 2 года / 5 лет 复数） | `Intl.RelativeTimeFormat` |
| 星期名、数字分组、小数分隔符 | `Intl.DateTimeFormat` / `Intl.NumberFormat` |

单位名用紧凑数组存（`I18N.zh.units.length = [...]`），顺序与 `js/units.js` 的 `UNITS` 表一致，
60 条单位名只占 8 行。`test.js` 会断言数组长度和 `UNITS` 表对齐，防止漏翻尾部单位。

### 加一种语言

1. `js/i18n.js` 里加 `I18N.xx = { ... }`（照抄 `I18N.es` 的结构）和 `I18N.xx.units`
2. `I18N_LANGS` / `I18N_LABELS` / `I18N_SHORT` / `I18N_LOCALES` 各加一项
3. `node scripts/i18n-check.js` —— 会列出所有缺翻译的 key

---

## 本地预览

直接双击 html 用 `file://` 打开也能跑，但**汇率的 fetch 会被浏览器拦截**，所以本地调试请起静态服务器：

```bash
cd toolbox
python -m http.server 8000
# 浏览器打开 http://localhost:8000
```

或 Node：`npx serve toolbox`

---

## 跑测试

```bash
cd toolbox
node test.js                    # 105 条纯逻辑单测 + i18n 引擎测试
node test-qr.js                 # QR 编码器结构测试
node scripts/i18n-check.js      # 词典完整性（缺翻译 / 死条目）
npm install --no-save jsdom
node scripts/smoke.js           # 18 个页面 × 4 种语言，真跑一遍
```

`test.js` 只 eval 每个 js 里 `// ---- 页面绑定 ----` **之前**的纯逻辑部分，
所以工具逻辑和 DOM 操作必须分开写（见 `TEMPLATE.md`）。

---

## 部署（三选一，都免费）

### Cloudflare Pages（推荐：免费 + 自带 CDN + 支持自定义域名）

1. 把 `toolbox` 推到一个 GitHub 仓库（见下节）
2. Cloudflare Dashboard → **Workers & Pages** → Create → **Pages** → Connect to Git → 选仓库
3. 构建设置：
   - Framework preset：`None`
   - Build command：**留空**
   - Build output directory：`/`（如果仓库根目录就是 toolbox 的内容）
4. 部署完得到 `xxx.pages.dev`，可再绑自己的域名

### Vercel

```bash
npm i -g vercel
cd toolbox
vercel          # 一路回车，得到 xxx.vercel.app
vercel --prod   # 正式上线
```

### Netlify

把 `toolbox` 文件夹直接拖到 https://app.netlify.com/drop

---

## 传到 GitHub

在 `toolbox` 目录下执行（第一次）：

```bash
cd toolbox
git init
git add .
git commit -m "Initial commit: Toolbox static site"
git branch -M main
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
git push -u origin main
```

之后每次改动：

```bash
git add .
git commit -m "描述这次改了什么"
git push
```

> 仓库建好后，Cloudflare Pages 会自动监听 `main` 分支，**每次 push 自动重新部署**。

---

## 广告接入

见 `ads/slots.html`。所有页面已用 `<div class="ad-slot" data-ad="...">` 预留位置，
接联盟代码时把 div 里的占位文字换成联盟给的 `<script>` 即可。

常用联盟（按对静态工具站友好度排序）：

| 联盟 | 门槛 | 特点 |
|---|---|---|
| Monetag | 低 | 支持 popunder / in-page push，小站也好过 |
| Adsterra | 低 | banner + popunder，单价稳定 |
| AdSense | 中 | 需要原创内容 + 隐私政策页（本站已备） |

---

## 加新工具

看 `TEMPLATE.md`，4 步，不需要改任何已有工具的代码。
