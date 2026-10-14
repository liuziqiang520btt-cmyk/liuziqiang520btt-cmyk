// ============================================================
// 图片路径规范化（站点级脚本）
//
// 解决的问题：Typora 粘贴图片时默认写的是本地路径，例如
//   C:\Users\xxx\AppData\Roaming\Typora\typora-user-images\a.png
//   ../images/a.png
// 这些路径推送到 GitHub Pages 后全是死链（图片根本没进仓库）。
//
// 这里在渲染后统一改写成站内绝对路径 /images/<文件名>；
// 遇到本地绝对路径时顺手把文件收进 source/images/，省得手动搬。
//
// 想关掉：_config.yml 里加
//   clarity_media:
//     normalize: false
// ============================================================

const fs = require('fs');
const path = require('path');

const IMG_EXT = /\.(png|jpe?g|gif|webp|avif|svg|bmp|ico)$/i;
const IMG_TAG = /(<img\b[^>]*?\ssrc=)(["'])([^"']+)\2/gi;

const harvested = new Set();
const cfg = (hexo.config && hexo.config.clarity_media) || {};

// 图片可能被压缩脚本从 .png 转成了 .jpg，这里按磁盘上实际存在的文件解析，
// 这样 Markdown 里的后缀不用改，也不会和正在编辑的 Typora 抢文件。
const CANDIDATES = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.svg', '.bmp', '.ico'];

function resolveName(destDir, name) {
  if (fs.existsSync(path.join(destDir, name))) return name;
  const dot = name.lastIndexOf('.');
  if (dot < 0) return name;
  const base = name.slice(0, dot);
  for (let i = 0; i < CANDIDATES.length; i++) {
    const f = base + CANDIDATES[i];
    if (fs.existsSync(path.join(destDir, f))) return f;
  }
  return name;
}

if (cfg.normalize !== false) {
  hexo.extend.filter.register('after_post_render', function (data) {
    const destDir = path.join(hexo.source_dir, 'images');

    data.content = data.content.replace(IMG_TAG, function (whole, pre, q, src) {
      // 外链 / data URI 不动
      if (/^(https?:)?\/\//i.test(src) || /^data:/i.test(src)) return whole;
      // 已经是 /images/ 下的就不动
      if (src.indexOf('/images/') === 0) return whole;
      if (!IMG_EXT.test(src)) return whole;

      const clean = src.replace(/\\/g, '/');
      const name = clean.split('/').filter(Boolean).pop();
      if (!name) return whole;

      // 本地绝对路径（Typora 默认行为）：把文件收进 source/images/
      if (/^[a-zA-Z]:\//.test(clean) && !harvested.has(clean)) {
        harvested.add(clean);
        const to = path.join(destDir, name);
        try {
          if (fs.existsSync(clean) && !fs.existsSync(to)) {
            fs.mkdirSync(destDir, { recursive: true });
            fs.copyFileSync(clean, to);
            hexo.log.warn('已把图片收进 source/images/' + name + ' —— 记得 git add 一起提交');
          }
        } catch (e) {
          hexo.log.warn('图片搬运失败（' + name + '）: ' + e.message);
        }
      }

      const real = resolveName(destDir, name);
      if (real !== name) {
        hexo.log.info('图片引用已按实际文件解析: ' + name + ' → ' + real);
      }
      return pre + q + '/images/' + real + q;
    });

    return data;
  });
}
