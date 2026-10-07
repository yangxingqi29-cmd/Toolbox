/* ==========================================================================
   test.js — 全部工具的核心逻辑单测
   只 eval 每个 js 里 "页面绑定" 之前的纯逻辑部分。
   跑： node test.js
   ========================================================================== */
const fs = require('fs');
const path = require('path');

let pass = 0, fail = 0;
function ok(cond, name, extra){
  console.log((cond ? '  PASS ' : '  FAIL ') + name + (extra !== undefined && !cond ? '  → ' + extra : ''));
  cond ? pass++ : fail++;
}
function eq(name, got, exp){
  const good = JSON.stringify(got) === JSON.stringify(exp);
  ok(good, name, good ? undefined : `got ${JSON.stringify(got)} exp ${JSON.stringify(exp)}`);
}
function near(name, got, exp, tol){
  const good = Math.abs(got - exp) < (tol || 1e-6);
  ok(good, name, good ? undefined : `got ${got} exp ${exp}`);
}

// 载入某个 js 的纯逻辑部分，返回指定符号
function load(file, symbols){
  const src = fs.readFileSync(path.join(__dirname, 'js', file), 'utf8')
    .split(/\/\/ ---- (?:页面绑定|绑定页面) ----|\/\* -+ \d+\. 页面绑定 -+ \*\//)[0];
  const fn = new Function('"use strict";\n' + src + '\nreturn {' + symbols.join(',') + '};');
  return fn();
}

/* ---------------------------------------------------------------- units */
console.log('[units]');
{
  const { UNITS } = load('units.js', ['UNITS']);
  const conv = (v, cat, from, to) => {
    const c = UNITS[cat];
    if (c.special){
      const toC = x => from === 'c' ? x : from === 'f' ? (x-32)*5/9 : x-273.15;
      const fromC = x => to === 'c' ? x : to === 'f' ? x*9/5+32 : x+273.15;
      return fromC(toC(v));
    }
    return v * c.units[from][1] / c.units[to][1];
  };
  near('1 km -> m',      conv(1,'length','km','m'), 1000);
  near('1 mi -> m',      conv(1,'length','mi','m'), 1609.344, 1e-9);
  near('1 kg -> lb',     conv(1,'weight','kg','lb'), 2.2046226218, 1e-8);
  near('100 C -> F',     conv(100,'temperature','c','f'), 212);
  near('32 F -> C',      conv(32,'temperature','f','c'), 0, 1e-9);
  near('1 gal -> L',     conv(1,'volume','gal','l'), 3.785411784, 1e-9);
  near('1 GB -> MB',     conv(1,'data','gb','mb'), 1024);
}

/* ---------------------------------------------------------------- color */
console.log('[color]');
{
  const { parseHex, parseRgb, rgbToHex, hslToRgb } = load('color.js',
    ['parseHex','parseRgb','rgbToHex','hslToRgb']);
  eq('parse #fff',     parseHex('#fff'), {r:255,g:255,b:255});
  eq('parse #4f8cff',  parseHex('#4f8cff'), {r:79,g:140,b:255});
  eq('rgb -> hex',     rgbToHex({r:79,g:140,b:255}), '#4f8cff');
  eq('hsl green',      rgbToHex(hslToRgb(120,100,50)), '#00ff00');
  eq('parse rgb()',    parseRgb('rgb(79, 140, 255)'), {r:79,g:140,b:255});
}

/* -------------------------------------------------------------- password */
console.log('[password]');
{
  const { generate } = load('password.js', ['generate']);
  const p = generate({upper:true,lower:true,digits:true,symbols:true,noAmb:false,length:20});
  eq('length 20', p.length, 20);
  const p2 = generate({upper:false,lower:true,digits:true,symbols:false,noAmb:true,length:32});
  ok('charset restricted', /^[a-z0-9]+$/.test(p2));
  ok('no ambiguous', !/[0Oo1lI|]/.test(p2));
}

/* ---------------------------------------------------------------- base64 */
console.log('[base64]');
{
  const { encodeText, decodeText, looksLikeBase64 } = load('base64.js',
    ['encodeText','decodeText','looksLikeBase64']);
  eq('encode hello',   encodeText('hello', false), 'aGVsbG8=');
  eq('decode hello',   decodeText('aGVsbG8='), 'hello');
  eq('utf8 roundtrip', decodeText(encodeText('你好 world 🎉', false)), '你好 world 🎉');
  eq('url-safe roundtrip', decodeText(encodeText('a?b>c~d', true)), 'a?b>c~d');
  ok('detect base64',  looksLikeBase64('aGVsbG8='));
  ok('reject plain',   !looksLikeBase64('hello world!'));
}

/* ------------------------------------------------------------ json */
console.log('[json]');
{
  const { parseJSON, stringifyJSON, minifyJSON, jsonStats, jsonValidate } = load('json-formatter.js',
    ['parseJSON','stringifyJSON','minifyJSON','jsonStats','jsonValidate']);
  ok('parse valid', parseJSON('{"a":1}').ok);
  const bad = parseJSON('{\n  "a": 1,\n  "b": oops\n}');
  ok('parse invalid detected', !bad.ok);
  eq('error line', bad.error.line, 3);
  eq('error col', bad.error.col, 8);
  ok('validator accepts nested', jsonValidate('{"a":[1,2,{"b":null}],"c":-1.5e3}').ok);
  ok('validator accepts top-level scalar', jsonValidate('"just a string"').ok);
  eq('trailing comma obj line', parseJSON('{\n  "a": 1,\n}').error.line, 3);
  ok('trailing comma rejected', !jsonValidate('{"a":1,}').ok);
  ok('single quotes rejected', !jsonValidate("{'a':1}").ok);
  ok('unquoted key rejected', !jsonValidate('{a:1}').ok);
  ok('leading zero rejected', !jsonValidate('01').ok);
  ok('bare word rejected', !jsonValidate('nul').ok);
  ok('unterminated string rejected', !jsonValidate('{"a":"x}').ok);
  ok('trailing garbage rejected', !jsonValidate('{"a":1} extra').ok);
  ok('empty input handled', !parseJSON('   ').ok);
  eq('pretty 2sp', stringifyJSON({a:1,b:[1,2]}, 2, false), '{\n  "a": 1,\n  "b": [\n    1,\n    2\n  ]\n}');
  eq('minify', minifyJSON({a:1,b:2}), '{"a":1,"b":2}');
  eq('sort keys', stringifyJSON({b:1,a:2}, 0, true), '{"a":2,"b":1}');
  eq('stats keys', jsonStats({a:1,b:{c:2}}).keys, 3);
}

/* -------------------------------------------------------------- timestamp */
console.log('[timestamp]');
{
  const { parseTimestamp, fmtISO } = load('timestamp.js', ['parseTimestamp','fmtISO']);
  const s = parseTimestamp('1700000000');
  eq('seconds unit', s.unit, 's');
  eq('epoch iso', fmtISO(s.date), '2023-11-14T22:13:20.000Z');
  const ms = parseTimestamp('1700000000000');
  eq('ms unit', ms.unit, 'ms');
  eq('bad input', parseTimestamp('abc'), null);
}

/* ---------------------------------------------------------- date calc */
console.log('[date-calculator]');
{
  const { daysBetween, diffYMD, isLeap, daysInMonth, addToDate } = load('date-calculator.js',
    ['daysBetween','diffYMD','isLeap','daysInMonth','addToDate']);
  eq('days Jan->Feb 2026', daysBetween(new Date(2026,0,1), new Date(2026,1,1)), 31);
  eq('diff ymd', JSON.stringify(diffYMD(new Date(2020,0,15), new Date(2021,2,20))), '{"y":1,"m":2,"d":5}');
  eq('leap 2024', isLeap(2024), true);
  eq('leap 1900', isLeap(1900), false);
  eq('leap 2000', isLeap(2000), true);
  eq('feb 2024 days', daysInMonth(2024,1), 29);
  const r = addToDate(new Date(2026,0,15), 0, 1, 0);
  eq('add 1 month', r.getMonth(), 1);
}

/* -------------------------------------------------------- word counter */
console.log('[word-counter]');
{
  const { analyze, topWords } = load('word-counter.js', ['analyze','topWords']);
  const a = analyze('Hello world. This is a test.');
  eq('words', a.words, 6);
  eq('sentences', a.sentences, 2);
  eq('paragraphs', a.paragraphs, 1);
  // 汉字 10 个；全角逗号/句号是 CJK 标点，不计入字数（与 Word 的"字数"一致）
  const cn = analyze('你好世界，这是一个测试。');
  eq('cjk counted', cn.cjk, 10);
  eq('cjk + words total', cn.wordCount, 10);
  eq('cjk punctuation excluded', analyze('，。！？').cjk, 0);
  eq('cjk ext-A counted', analyze('\u3400\u4dbf').cjk, 2);
  const top = topWords('apple banana apple cherry apple banana');
  eq('top word', top[0][0], 'apple');
  eq('top count', top[0][1], 3);
}

/* ------------------------------------------------------- case converter */
console.log('[case-converter]');
{
  const { convert, splitWords } = load('case-converter.js', ['convert','splitWords']);
  eq('camel', convert('hello world', 'camel'), 'helloWorld');
  eq('pascal', convert('hello world', 'pascal'), 'HelloWorld');
  eq('snake', convert('helloWorld', 'snake'), 'hello_world');
  eq('kebab', convert('hello world', 'kebab'), 'hello-world');
  eq('constant', convert('hello world', 'constant'), 'HELLO_WORLD');
  eq('split camel', JSON.stringify(splitWords('getUserName')), '["get","User","Name"]');
  eq('split acronym', JSON.stringify(splitWords('HTTPServer')), '["HTTP","Server"]');
}

/* ---------------------------------------------------------------- uuid */
console.log('[uuid]');
{
  const { uuidV4, formatUuid } = load('uuid.js', ['uuidV4','formatUuid']);
  const u = uuidV4();
  ok('v4 shape', /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(u), u);
  ok('unique', uuidV4() !== uuidV4());
  eq('no dashes len', formatUuid(u, {noDashes:true}).length, 32);
  ok('braces', formatUuid(u, {braces:true}).startsWith('{'));
  ok('upper', formatUuid(u, {upper:true}) === u.toUpperCase());
}

/* ------------------------------------------------------------ mortgage */
console.log('[mortgage]');
{
  const { monthlyPayment, amortize, amortizeLinear } = load('mortgage.js',
    ['monthlyPayment','amortize','amortizeLinear']);
  const pay = monthlyPayment(300000, 6.5, 30);
  near('300k@6.5%/30y', pay, 1896.20, 1.0);
  const plan = amortize(300000, 6.5, 30);
  eq('360 payments', plan.schedule.length, 360);
  near('total = pay*360', plan.totalPaid, plan.monthly*360, 1);
  ok('interest positive', plan.totalInterest > 300000);
  near('final balance ~0', plan.schedule[359].balance, 0, 1);
  const lin = amortizeLinear(300000, 6.5, 30);
  ok('linear first > last', lin.monthlyFirst > lin.monthlyLast);
  ok('linear interest < amortizing', lin.totalInterest < plan.totalInterest);
}

/* --------------------------------------------------------- regex tester */
console.log('[regex-tester]');
{
  const { findMatches, esc } = load('regex-tester.js', ['findMatches','esc']);
  const r = findMatches('\\d+', 'g', 'a1b22c333');
  eq('3 matches', r.matches.length, 3);
  eq('values', JSON.stringify(r.matches.map(m=>m.value)), '["1","22","333"]');
  const g = findMatches('(\\w+)@(\\w+)', 'g', 'me@site');
  eq('groups', JSON.stringify(g.matches[0].groups), '["me","site"]');
  ok('invalid regex', !findMatches('([', 'g', 'x').ok);
  eq('esc html', esc('<a>&'), '&lt;a&gt;&amp;');
  const zero = findMatches('a*', 'g', 'bbb');
  ok('no infinite loop on zero-width', zero.matches.length >= 1 && zero.matches.length < 100);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
