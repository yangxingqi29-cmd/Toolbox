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
