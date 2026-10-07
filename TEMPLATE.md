# 加一个新工具 = 复制同结构（4 步）

本站每个工具都是「一个 html + 一个 js」，互不依赖。加新工具就复制这两块，改内容即可。

**核心约定：一个 js 文件分两半，中间用 `// ---- 页面绑定 ----` 分隔。**

```
上半部分：纯函数（无 DOM、无 window）  ← test.js 只 eval 这一段
下半部分：(function init(){ ... })()   ← DOM 操作全在这里
```

这条约定是 `node test.js` 能跑单测的前提，别破坏它。

---

## Step 1 — 复制页面

```bash
cp tools/base64.html tools/my-tool.html
```

改 4 处：

- `<title>` 和 `<meta name="description">`（SEO 用，写清楚这个工具干嘛、给谁用）
- `<h1>` 和 `.tool-head` 里的 `<p>`（页面标题和一句话说明）
- `<script src="../js/xxx.js">` 指向新 js
- `.panel` 里的表单控件换成新工具的

> 顶部导航、面包屑、广告位、页脚**不用动**，它们是全站统一的（导航由 `js/nav.js` 注入）。

## Step 2 — 复制脚本

```bash
cp js/base64.js js/my-tool.js
```

保留你要的纯逻辑，**页面绑定段整体按新控件重写**。上半部分只留纯函数。

## Step 3 — 挂到导航（一处改动，全站生效）

编辑 `js/nav.js`，在 `GROUPS` 里对应分类下加一行：

```js
['Calculators', [
  ['mortgage.html',        'Mortgage Calculator'],
  ['date-calculator.html', 'Date Calculator'],
  ['my-tool.html',         'My Tool']          // ← 加这行
]]
```

新分类就再加一个 `['分类名', [...]]`。

## Step 4 — 挂到首页

编辑 `index.html`，在对应分类的 `<section class="grid">` 里复制一张卡片：

```html
<a class="tile" href="tools/my-tool.html">
  <div class="ico">&#128295;</div>
  <h3>My Tool</h3>
  <p>One sentence about what it does.</p>
</a>
```

顺手把 `tools/my-tool.html` 加进 `sitemap.xml`。

## Step 5 — 让文案支持多语言

新页面里的静态文案**不用手写 `data-i18n`**，跑一下标记脚本就行：

```bash
node scripts/i18n-tag.js
```

它会自动给"只含文本"的元素加上 `data-i18n="英文原文"`，把面包屑拆成独立 span，
并给 `placeholder` / `meta description` 加上对应属性。**幂等，重复跑不会叠加。**

然后补词典：

```bash
node scripts/i18n-check.js     # 列出所有缺翻译的 key
```

把列出来的 key 补进 `js/i18n.js` 的 `I18N.zh` / `I18N.es` / `I18N.ru` 三份，
再跑一次直到 `缺失翻译：0 条`。

**JS 里拼出来的动态文案**要手动改成 `t()`：

```js
// 之前
$status.textContent = 'Merged ' + n + ' files → ' + p + ' pages';

// 之后
$status.textContent = t('Merged {n} files → {p} pages', { n, p });
```

几条踩过的坑：

- **纯逻辑段（分隔线以上）里不要调 `t()`**，`test.js` 会在 Node 里 eval 那段，
  没有 `t`。让纯函数返回"错误 code + 参数"，由绑定段翻译 —— 见 `json-formatter.js`。
- **局部变量别叫 `t`**，会盖住 i18n 的 `t()`。`word-counter.js` 原来有个 `const t = $in.value`，已改名。
- `<textarea>` 的内容是**默认值**不是文案，脚本会整块跳过 —— 往里面包 `<span>` 会变成字面文本。
- 品牌 logo（`Tool<span>box</span>`）里的 "Tool"/"box" 是拆开做样式的，脚本也会跳过。
- 能交给 `Intl` 的就别进词典（货币名、相对时间、星期名、数字格式），见 README。

---

## 现有工具的「骨架」对照

| 文件 | 纯函数部分 | DOM 绑定部分 |
|---|---|---|
| `js/units.js` | `convert()` / `fmt()` / `UNITS` 表 | `fillUnits()` / `render()` |
| `js/currency.js` | `convert()` / `loadRates()` | `render()` / `renderPopular()` |
| `js/timestamp.js` | `parseTimestamp()` / `fmtLocal/UTC/ISO/RFC()` / `relative()` | `render()` |
| `js/color.js` | `parseHex/Rgb/Hsl()`、`rgbToHex/Hsl()`、`hslToRgb()` | `updateFrom()` |
| `js/case-converter.js` | `splitWords()` / `TRANSFORMS` / `convert()` | `render()` |
| `js/password.js` | `randInt()` / `generate()` / `strength()` | `run()` |
| `js/uuid.js` | `uuidV4()` / `formatUuid()` | `render()` |
| `js/qrcode.js` | GF256 / RS / `buildQR()` / `penalty()` | `renderQR()` |
| `js/json-formatter.js` | `jsonValidate()` / `parseJSON()` / `stringifyJSON()` / `jsonStats()` | `run()` |
| `js/base64.js` | `encodeText()` / `decodeText()` / `looksLikeBase64()` | `doEncode()` / `doDecode()` |
| `js/regex-tester.js` | `findMatches()` / `highlight()` / `esc()` | `render()` |
| `js/word-counter.js` | `analyze()` / `topWords()` | `render()` |
| `js/image-compressor.js` | `targetSize()` / `compress()` | `run()` |
| `js/pdf-tools.js` | `mergePdfs()` / `extractPages()` / `parseRange()` | `run()` |
| `js/mortgage.js` | `monthlyPayment()` / `amortize()` / `amortizeLinear()` | `render()` |
| `js/date-calculator.js` | `daysBetween()` / `diffYMD()` / `addToDate()` / `isLeap()` | `render()` |

**规律：上半部分是可测试的纯逻辑，下半部分是 `(function init(){...})()`。**

---

## 加测试

新工具的纯函数写完后，在 `test.js` 里加一段：

```js
console.log('[my-tool]');
{
  const { myFn } = load('my-tool.js', ['myFn']);
  eq('case name', myFn('input'), 'expected');
  near('numeric case', myFn(1), 1.5, 1e-9);
}
```

`load()` 会自动切掉 `// ---- 页面绑定 ----` 之后的部分，所以纯函数里**不要碰 DOM**。

跑：

```bash
node test.js
```

如果新工具用了单位名之类的数组翻译，记得同步 `I18N.xx.units`——
`test.js` 里有一条断言专门比对数组长度和 `UNITS` 表是否对齐。

最后跑一遍全站冒烟（18 个页面 × 4 种语言，真执行 JS）：

```bash
node scripts/smoke.js
```

---

## 下一批候选工具（都符合「纯前端 + 高 RPM」）

| 工具 | 难度 | 关键词方向 | 备注 |
|---|---|---|---|
| 图片格式转换 / 转 WebP | ★ | `png to webp`, `convert image` | 复用 image-compressor 的 Canvas 流程 |
| 视频压缩 | ★★★ | `compress video online` | 需要 ffmpeg.wasm，体积大，但关键词极肥 |
| 二维码扫描（图片 → 内容） | ★★ | `qr code reader` | 需 jsQR，轻量 |
| 条码生成 | ★ | `barcode generator` | 与 QR 生成同类，流量互补 |
| 发票 / 报价单生成器 | ★★ | `invoice generator` | **商业意图最强**，RPM 最高 |
| 简历生成器 | ★★ | `resume builder`, `cv maker` | 搜索量巨大 |
| 工资 / 个税计算 | ★ | `salary calculator`, `take home pay` | 欧美流量单价高 |
| 单位换算补充：烹饪 / 烘焙 | ★ | `cups to grams` | 长尾，量大 |
| 随机分组 / 抽签 | ★ | `random team generator` | 教师群体刚需 |
| 密码强度检测 | ★ | `password strength checker` | 复用 password.js 的 `strength()` |
| 文本差异对比（diff） | ★★ | `text compare`, `diff checker` | 程序员流量 |
| CSV ↔ JSON 互转 | ★ | `csv to json` | 复用 base64/json 的下载逻辑 |
| 时区转换 / 会议时间规划 | ★★ | `time zone converter` | 跨境远程办公刚需 |
| 图片加水印 | ★★ | `add watermark to photo` | 与图片压缩同一套 Canvas 管线 |

**优先级建议**：发票生成器、简历生成器、图片转 WebP、时区转换、CSV↔JSON ——
这几个搜索量大、商业意图强、且能直接复用现有代码骨架。
