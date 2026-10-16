// ============================================================
// 把图片收进仓库
//
//   node scripts/harvest-images.js        扫一遍并收割
//   node scripts/harvest-images.js --dry  只看会做什么
//
// 背景：Typora 默认把粘贴的图片丢在
//   C:\Users\你\AppData\Roaming\Typora\typora-user-images\
// 这个目录不在博客仓库里，推送后图片一定是死链。
//
// 这个脚本扫描 source/ 下的所有文本文件，凡是引用里出现
// 「Windows 本地绝对路径」的图片，就把它复制到 source/images/，
// 并把引用改写成 ../images/<文件名>。
//
// 这样无论 Typora 的图片设置是哪种，提交进仓库的图片都是完整的。
// ============================================================

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'source');
const DEST = path.join(SRC, 'images');
// 照片墙的图片就在 source/photos/ 下，那是它们的「正确位置」，
// 不能被当成散图收走 —— 否则照片墙会被搬空。
const PHOTOS = path.join(SRC, 'photos');
const DRY = process.argv.indexOf('--dry') > -1;

// 匹配 Windows 本地绝对路径（可带 file:// 前缀），结尾必须是图片后缀
const LOCAL_IMG = /(?:file:\/\/\/)?[A-Za-z]:[\\/][^\s)"'<>|*?]*?\.(?:png|jpe?g|gif|webp|avif|svg|bmp|ico)/gi;
const TEXT_EXT = /\.(md|markdown|yml|yaml|json|html|htm|pug|ejs|styl|css|txt)$/i;
const SKIP_DIR = new Set(['node_modules', '.git', 'public', '.deploy_git']);

function walk(dir, out) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return out; }
  for (const e of entries) {
    if (SKIP_DIR.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (TEXT_EXT.test(e.name)) out.push(p);
  }
  return out;
}

function toNative(p) {
  return p.replace(/^file:\/\/\//i, '').replace(/\//g, path.sep);
}

const files = walk(SRC, []);
const details = [];
let moved = 0, rewritten = 0, missing = 0;

for (const f of files) {
  let txt;
  try { txt = fs.readFileSync(f, 'utf8'); } catch (e) { continue; }
  if (txt.indexOf(':\\') < 0 && txt.indexOf(':/') < 0 && txt.indexOf('file:///') < 0) continue;

  let touched = false;
  const out = txt.replace(LOCAL_IMG, function (hit) {
    const native = toNative(hit);
    const name = path.basename(native);
    if (!fs.existsSync(native)) {
      missing++;
      details.push('  ! 找不到文件，引用保持原样: ' + native);
      return hit;
    }
    const to = path.join(DEST, name);
    if (!fs.existsSync(to)) {
      if (!DRY) {
        fs.mkdirSync(DEST, { recursive: true });
        fs.copyFileSync(native, to);
      }
      moved++;
      details.push('  + 收进仓库: ' + name + '  (' + Math.round(fs.statSync(native).size / 1024) + ' KB)');
    }
    touched = true;
    return '../images/' + name;
  });

  if (touched && out !== txt) {
    if (!DRY) fs.writeFileSync(f, out, 'utf8');
    rewritten++;
    details.push('  ~ 改写引用: ' + path.relative(ROOT, f));
  }
}

// 第二遍：Typora 的「复制图片到 ./assets 文件夹」会把图片放在文章旁边
// （source/_posts/assets/）。_posts 以下划线开头，Hexo 不会发布它下面的文件，
// 所以这些图虽然进了仓库却访问不到 —— 一并复制进 source/images/。
// 注意这里用「复制」而不是「移动」：原文件保留，Typora 的预览才不会坏。
const IMG_FILE = /\.(png|jpe?g|gif|webp|avif|svg|bmp|ico)$/i;

// 把文章里的 assets/<name> 引用改写成 ../images/<name>，
// 这样文件被移走后 Typora 的预览依然找得到。
// 这里用字符串替换而不是正则，避免反斜杠转义层层嵌套出错。
function rewriteRefs(name) {
  const slash = 'assets/' + name;
  const back = 'assets' + String.fromCharCode(92) + name;
  const dest = '../images/' + name;
  for (const f of files) {
    let txt;
    try { txt = fs.readFileSync(f, 'utf8'); } catch (e) { continue; }
    if (txt.indexOf(slash) < 0 && txt.indexOf(back) < 0) continue;
    const out = txt.split(slash).join(dest).split(back).join(dest);
    try { fs.writeFileSync(f, out, 'utf8'); } catch (e) {}
  }
}

let strayed = 0;
(function sweepStray(dir) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
  for (const e of entries) {
    if (SKIP_DIR.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (path.resolve(p) !== path.resolve(DEST) && path.resolve(p) !== path.resolve(PHOTOS)) sweepStray(p);
      continue;
    }
    if (!IMG_FILE.test(e.name)) continue;
    const to = path.join(DEST, e.name);
    if (fs.existsSync(to)) {
      // source/images/ 里已有同名文件，原件就是冗余的 —— 删掉省磁盘。
      // 但必须同样改写引用：文件被删了，Markdown 里那句 assets/xxx.jpg 就悬空了
      // （博客页面看不出来，因为 scripts/media.js 在渲染期会把 src 改成 /images/xxx；
      //   而 Typora / 编辑器按磁盘路径找，就会开天窗）。
      if (!DRY) {
        try { fs.unlinkSync(p); } catch (x) {}
        rewriteRefs(e.name);
      }
      strayed++;
      details.push('  - 删除冗余原件并改写引用: ' + path.relative(ROOT, p));
      continue;
    }
    if (!DRY) {
      fs.mkdirSync(DEST, { recursive: true });
      // 移动而不是复制：否则文章旁边的原件会越堆越多（曾堆到 157 MB）
      fs.renameSync(p, to);
      rewriteRefs(e.name);
    }
    strayed++;
    details.push('  + 收进仓库: ' + e.name + '  （来自 ' + path.relative(ROOT, p) + '，原件已移走）');
  }
})(SRC);

console.log('[harvest] 扫描 ' + files.length + ' 个文件');
if (details.length) console.log(details.join('\n'));
console.log('[harvest] ' + (DRY ? '[dry] ' : '') + '收进 ' + (moved + strayed) + ' 张图片，改写 ' + rewritten + ' 个文件' + (missing ? '，' + missing + ' 处找不到源文件' : ''));
