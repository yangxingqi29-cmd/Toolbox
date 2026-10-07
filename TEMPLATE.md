# 加一个新工具 = 复制同结构（4 步）

本站每个工具都是"一个 html + 一个 js"，互不依赖。加新工具就复制这两块，改内容即可。

---

## Step 1 — 复制页面

```bash
cp tools/base64.html tools/json-formatter.html
```

改 4 处：
- `<title>` 和 `<meta name="description">`（SEO 用，写清楚这个工具干嘛）
- `<h1>` 和 `<p>`（页面标题和说明）
- `<script src="../js/xxx.js">` 指向新 js
- 表单区（`<div class="panel">` 里面）换成新工具的控件

> 顶部导航、面包屑、广告位、页脚**不用动**，它们是全站统一的。

## Step 2 — 复制脚本

```bash
cp js/base64.js js/json-formatter.js
```

只保留你要的逻辑，**页面绑定段（`(function init(){...})()`）按新控件重写**。
工具逻辑（纯函数）放上半部分，DOM 操作放下半部分，互不污染。

## Step 3 — 挂到首页

编辑 `index.html`，在 `<section class="grid">` 里复制一张卡片：

```html
<a class="tile" href="tools/json-formatter.html">
  <div class="ico">&#128295;</div>
  <h3>JSON Formatter</h3>
  <p>Pretty-print, minify and validate JSON.</p>
</a>
```

## Step 4 — 更新导航（可选）

导航是各页手写的，加一个工具要同步。批量替换：

```bash
cd tools
sed -i 's|\(<a href="base64.html">Base64</a>\)|\1\n      <a href="json-formatter.html">JSON</a>|' *.html
sed -i 's|\(<a href="tools/base64.html">Base64</a>\)|\1\n      <a href="tools/json-formatter.html">JSON</a>|' ../index.html
```

（工具多了之后，建议把导航抽成一个 `nav.js` 用 JS 注入，就不用每页改了。）

---

## 现有工具的"骨架"对照

| 文件 | 纯函数部分 | DOM 绑定部分 |
|---|---|---|
| `js/units.js` | `convert()` / `fmt()` / `UNITS` 表 | `fillUnits()` / `render()` |
| `js/currency.js` | `convert()` / `loadRates()` | `render()` / `renderPopular()` |
| `js/password.js` | `randInt()` / `generate()` / `strength()` | `run()` |
| `js/color.js` | `parseHex/Rgb/Hsl()`、`rgbToHex/Hsl()`、`hslToRgb()` | `updateFrom()` |
| `js/qrcode.js` | GF256 / RS / `buildQR()` / `penalty()` | `renderQR()` |
| `js/base64.js` | `encodeText()` / `decodeText()` / `looksLikeBase64()` | `doEncode()` / `doDecode()` |

**规律：上半部分是可测试的纯逻辑，下半部分是 `(function init(){...})()`。**
所以 `node test.js` 能直接 eval 上半部分来跑单测。

---

## 下一批建议工具（都符合"纯前端 + 高 RPM"）

| 工具 | 难度 | 关键词方向 |
|---|---|---|
| JSON 格式化/压缩 | ★ | `json formatter`, `json validator` |
| 图片压缩 | ★★ | `compress image online` |
| PDF 合并/拆分 | ★★★ | `merge pdf`, `split pdf`（需 pdf-lib CDN） |
| 时间戳转换 | ★ | `unix timestamp converter` |
| 日期计算器 | ★ | `date calculator`, `days between dates` |
| 字数/字符统计 | ★ | `word counter` |
| 大小写转换 | ★ | `case converter` |
| 房贷/利息计算器 | ★★ | `mortgage calculator`（欧美流量，单价高） |
| UUID 生成 | ★ | `uuid generator` |
| 正则测试 | ★★ | `regex tester` |

**优先级建议**：JSON、图片压缩、PDF、房贷计算器——这四个搜索量大、商业意图强、RPM 高。

---

## 测试模板

新工具的纯函数写完后，在 `test.js` 里照抄一段：

```js
const xsrc = fs.readFileSync(path.join(__dirname,'js','json-formatter.js'),'utf8')
  .split('// ---- 页面绑定 ----')[0];
eval(xsrc);
eq('pretty print', format('{"a":1}'), '{\n  "a": 1\n}');
```

跑 `node test.js` 验证。
