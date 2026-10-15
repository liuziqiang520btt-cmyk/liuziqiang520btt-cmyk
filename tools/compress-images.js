// ============================================================
// 图片自动压缩
//
//   node scripts/compress-images.js            压一遍 source/images 下所有图
//   node scripts/compress-images.js --watch    常驻监听，粘进来就压
//   node scripts/compress-images.js --dry      只报告，不写文件
//
// 规则：
//   * 宽度超过 1600px 或体积超过 200KB 才处理
//   * 压完必须至少小 15% 才写回（避免反复重压劣化）
//   * 文件名和后缀都不变，所以 Markdown 里的引用永远不用改
// ============================================================

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'source', 'images');
const LOG = path.join(ROOT, '.img-watch.log');

const MAX_W = 1600;
const MIN_BYTES = 200 * 1024;
const SHRINK = 0.85;
const RASTER = /\.(png|jpe?g|webp|avif|tiff?)$/i;

const argv = process.argv.slice(2);
const DRY = argv.indexOf('--dry') > -1;
const WATCH = argv.indexOf('--watch') > -1;
const TO_JPG = argv.indexOf('--jpg') > -1;   // 把无透明通道的 PNG 转成 JPEG，体积再小 3~4 倍

// --jpg 会把 x.png 变成 x.jpg，这里同步改掉各处的引用。
// 万一没改到（比如 Typora 又把旧内容存回去了），站点脚本 media.js 还会按
// source/images 下实际存在的文件后缀兜底解析，所以不会出现死链。
const REF_FILES = [];
function collectRefFiles() {
  const srcDir = path.join(ROOT, 'source');
  const walk = function (dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { if (e.name.charAt(0) !== '.') walk(p); }
      else if (/\.(md|markdown|yml|yaml|json|html|pug|styl)$/i.test(e.name)) REF_FILES.push(p);
    }
  };
  if (fs.existsSync(srcDir)) walk(srcDir);
  for (const f of ['_config.yml', '_config.clarity.yml']) {
    const p = path.join(ROOT, f);
    if (fs.existsSync(p)) REF_FILES.push(p);
  }
}
function retarget(oldName, newName) {
  let n = 0;
  for (const f of REF_FILES) {
    let txt;
    try { txt = fs.readFileSync(f, 'utf8'); } catch (e) { continue; }
    const re = new RegExp(oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    if (!re.test(txt)) continue;
    const out = txt.replace(re, newName);
    try { fs.writeFileSync(f, out, 'utf8'); n++; } catch (e) {}
  }
  return n;
}

let _sharp = null;
function sharpLib() {
  if (!_sharp) _sharp = require('sharp');
  return _sharp;
}

function pad(n) { return String(n).padStart(2, '0'); }
function stamp() {
  const d = new Date();
  return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
}
function log(msg) {
  const line = '[' + stamp() + '] ' + msg;
  console.log(line);
  try { fs.appendFileSync(LOG, line + '\r\n'); } catch (e) {}
}
function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
function kb(n) { return n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.round(n / 1024) + ' KB'; }

async function settle(file) {
  // 等文件写完（Typora 拷大图时体积会连续变化）
  let last = -1;
  for (let i = 0; i < 40; i++) {
    let size;
    try { size = fs.statSync(file).size; } catch (e) { return false; }
    if (size > 0 && size === last) return true;
    last = size;
    await sleep(200);
  }
  return false;
}

async function processFile(file) {
  const name = path.basename(file);
  if (!RASTER.test(name)) return false;
  if (!(await settle(file))) return false;

  let before;
  try { before = fs.statSync(file).size; } catch (e) { return false; }

  const ext = path.extname(name).toLowerCase();
  let meta;
  try { meta = await sharpLib()(file).metadata(); } catch (e) { log('跳过 ' + name + '（无法读取: ' + e.message + '）'); return false; }

  const tooWide = (meta.width || 0) > MAX_W;
  if (before <= MIN_BYTES && !tooWide) return false;

  // .rotate() 不能省：手机/微信的图常见「像素横向存 + EXIF 标记方向」，
  // 不调它的话 EXIF 会被剥掉而方向没烤进像素，网站上就变成躺倒的。
  let pipe = sharpLib()(file).rotate().resize({ width: MAX_W, withoutEnlargement: true });
  if (ext === '.png') pipe = pipe.png({ compressionLevel: 9, palette: true, quality: 90, effort: 8 });
  else if (ext === '.jpg' || ext === '.jpeg') pipe = pipe.jpeg({ quality: 82, progressive: true, mozjpeg: true });
  else if (ext === '.webp') pipe = pipe.webp({ quality: 82 });
  else if (ext === '.avif') pipe = pipe.avif({ quality: 55 });
  else if (ext === '.tif' || ext === '.tiff') pipe = pipe.tiff({ compression: 'deflate' });
  else return false;

  let buf;
  try { buf = await pipe.toBuffer(); } catch (e) { log('跳过 ' + name + '（压缩失败: ' + e.message + '）'); return false; }

  // --jpg：无透明通道的 PNG 转成 JPEG，通常还能再小 3~4 倍
  let outBuf = buf;
  let outFile = file;
  let outName = name;
  if (TO_JPG && ext === '.png' && !meta.hasAlpha) {
    let jbuf = null;
    try {
      jbuf = await sharpLib()(file)
        .rotate()
        .resize({ width: MAX_W, withoutEnlargement: true })
        .jpeg({ quality: 82, progressive: true, mozjpeg: true })
        .toBuffer();
    } catch (e) { jbuf = null; }
    if (jbuf && jbuf.length < buf.length * 0.8) {
      outBuf = jbuf;
      outName = name.replace(/\.png$/i, '.jpg');
      outFile = path.join(path.dirname(file), outName);
    }
  }

  const renamed = outFile !== file;
  if (!renamed && outBuf.length >= before * SHRINK) {
    log(name + ' 已经是优化过的（' + kb(before) + '），不动');
    return false;
  }

  const pct = Math.round((1 - outBuf.length / before) * 100);
  if (DRY) {
    log('[dry] ' + name + (renamed ? ' → ' + outName : '') + '  ' + kb(before) + ' → ' + kb(outBuf.length) + '  （- ' + pct + '%）');
    return false;
  }

  // 先写临时文件再改名，避免 Hexo 正好读到写了一半的图
  const tmp = path.join(path.dirname(file), '.' + name + '.tmp');
  try {
    fs.writeFileSync(tmp, outBuf);
    fs.renameSync(tmp, outFile);
    if (renamed) fs.unlinkSync(file);
  } catch (e) {
    try { fs.unlinkSync(tmp); } catch (e2) {}
    log('写入失败 ' + name + ': ' + e.message + '（可能被 Typora 占用，稍后会重试）');
    return false;
  }

  let extra = '';
  if (renamed) {
    const hits = retarget(name, outName);
    extra = '，已更新 ' + hits + ' 个文件里的引用';
  }
  log('已压缩 ' + name + (renamed ? ' → ' + outName : '') + '  ' + kb(before) + ' → ' + kb(outBuf.length) + '  （- ' + pct + '%' + extra + '）');
  return true;
}

// 收集一个目录下的图片；recursive 为真时连子目录一起收
function gather(dir, recursive) {
  const out = [];
  (function w(d) {
    let es;
    try { es = fs.readdirSync(d, { withFileTypes: true }); } catch (e) { return; }
    for (const e of es) {
      if (e.name.charAt(0) === '.') continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) { if (recursive) w(p); continue; }
      if (RASTER.test(e.name)) out.push(p);
    }
  })(dir);
  return out;
}

async function sweep() {
  let n = 0;
  for (const f of gather(DIR, false)) { if (await processFile(f)) n++; }
  if (WATCH && n) log('本轮压缩了 ' + n + ' 张');
  return n;
}

function startWatch() {
  fs.mkdirSync(DIR, { recursive: true });
  log('开始监听 ' + DIR + '（关掉这个窗口或结束进程即停止）');
  const pending = new Set();
  let timer = null;
  const flush = async function () {
    const names = Array.from(pending);
    pending.clear();
    for (const n of names) await processFile(path.join(DIR, n));
  };
  fs.watch(DIR, function (evt, fname) {
    if (!fname) return;
    if (!RASTER.test(fname)) return;
    if (fname.charAt(0) === '.') return;
    if (/\.tmp$/i.test(fname)) return;
    pending.add(fname);
    clearTimeout(timer);
    timer = setTimeout(flush, 1500);
  });

  // 同时盯住文章目录：Typora「复制图片到 ./assets 文件夹」会把图放在文章旁边，
  // 而 _posts 下划线开头、Hexo 不发布它下面的文件，所以这里一出现就收进 source/images/。
  // 这样完全不依赖 git 钩子 —— GitHub Desktop 环境下钩子会因为中文用户名起不来。
  const POSTS = path.join(ROOT, 'source', '_posts');
  let harvestTimer = null;
  const runHarvest = function () {
    const r = spawnSync(process.execPath, [path.join(__dirname, 'harvest-images.js')], { encoding: 'utf8' });
    const out = ((r.stdout || '') + (r.stderr || '')).trim();
    if (out) log(out);
    sweep();
  };
  // 用轮询而不是 fs.watch(recursive)：实测 fs.watch 的递归模式在这个进程里
  // 收不到事件（单独写脚本跑却正常），轮询行为确定、可验证。
  setInterval(function () {
    const r = spawnSync(process.execPath, [path.join(__dirname, 'harvest-images.js')], { encoding: 'utf8' });
    const out = ((r.stdout || '') + (r.stderr || '')).trim();
    if (out && out.indexOf('收进 0 张') < 0) {
      log(out);
      sweep();
    }
  }, 4000);
  log('每 4 秒扫一次 ' + POSTS + '（Typora 放在文章旁边的图会自动收进 source/images/）');

  process.on('SIGINT', function () { log('监听已停止'); process.exit(0); });
}

(async function () {
  if (TO_JPG) collectRefFiles();
  if (WATCH) { await sweep(); startWatch(); }
  else {
    const n = await sweep();
    log((DRY ? '[dry] 检查完毕' : '完成') + '，本次处理 ' + n + ' 张');
    process.exit(0);
  }
})().catch(function (e) { log('出错: ' + e.message); process.exit(1); });
