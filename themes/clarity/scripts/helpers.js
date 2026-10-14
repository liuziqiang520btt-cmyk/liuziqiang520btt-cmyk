// Clarity theme helpers
// Hexo 会自动加载 themes/<name>/scripts/**/*.js 并注册其中的 helper。
// 这些函数在 Pug 模板里可以直接当普通函数调用。
'use strict';

const fs = require('fs');
const pathFn = require('path');
const crypto = require('crypto');

function stripTags (html) {
  return String(html == null ? '' : html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/* 中英混排字数与阅读时长：中文 300 字/分钟，西文 200 词/分钟 */
function computeStats (content) {
  const plain = stripTags(content).replace(/\s+/g, ' ');
  const cn = (plain.match(/[\u4e00-\u9fa5]/g) || []).length;
  const en = (plain.replace(/[\u4e00-\u9fa5]/g, ' ').match(/[A-Za-z0-9][A-Za-z0-9'\-_.]*/g) || []).length;
  return {
    words: cn + en,
    minutes: Math.max(1, Math.round(cn / 300 + en / 200))
  };
}

/* 资源版本号：把主题 css/ 与 js/ 的内容一起哈希。
 * 内容没变版本号就不变，内容一变 URL 就变，绕开浏览器与 CDN 缓存。 */
let ASSET_VERSION = null;
function assetVersion () {
  if (ASSET_VERSION) return ASSET_VERSION;
  const hash = crypto.createHash('sha1');
  ['css', 'js'].forEach(function (sub) {
    const dir = pathFn.join(hexo.theme_dir, 'source', sub);
    let names = [];
    try {
      names = fs.readdirSync(dir).sort();
    } catch (e) {
      return;
    }
    names.forEach(function (name) {
      const file = pathFn.join(dir, name);
      try {
        if (fs.statSync(file).isFile()) hash.update(name).update(fs.readFileSync(file));
      } catch (e) { /* 忽略读不到的文件 */ }
    });
  });
  ASSET_VERSION = hash.digest('hex').slice(0, 8);
  return ASSET_VERSION;
}

hexo.extend.helper.register('clarity_asset', function (assetPath) {
  const url = typeof this.url_for === 'function' ? this.url_for(assetPath) : assetPath;
  return url + '?v=' + assetVersion();
});

hexo.extend.helper.register('clarity_stats', function (post) {
  return computeStats(post && post.content);
});

hexo.extend.helper.register('clarity_word_count', function (post) {
  return computeStats(post && post.content).words;
});

hexo.extend.helper.register('clarity_reading_time', function (post) {
  return computeStats(post && post.content).minutes;
});

hexo.extend.helper.register('clarity_excerpt', function (post, len) {
  const max = len || 96;
  let src = '';
  if (post && post.excerpt) {
    src = post.excerpt;
  } else if (post && post.content) {
    // 没有 <!-- more --> 时，取正文第一段作为摘要
    const first = /<p[^>]*>([\s\S]*?)<\/p>/i.exec(post.content);
    src = first ? first[1] : post.content;
  }
  let text = stripTags(src).replace(/\s+/g, ' ').trim();
  // 中文标点两侧不留空格
  text = text.replace(/\s+([，。、；：？！）”』】》…])/g, '$1')
    .replace(/([（“『【《])\s+/g, '$1')
    .replace(/\s+([,.!?;:)])/g, '$1')
    .replace(/([(])\s+/g, '$1');
  return text.length > max ? text.slice(0, max) + '…' : text;
});

/* 无封面文章：按标题哈希生成稳定的渐变封面 */
const GRADIENTS = [
  'linear-gradient(140deg,#0a84ff 0%,#5e5ce6 48%,#bf5af2 100%)',
  'linear-gradient(140deg,#30d158 0%,#0a84ff 100%)',
  'linear-gradient(140deg,#ff9f0a 0%,#ff375f 100%)',
  'linear-gradient(140deg,#5e5ce6 0%,#0a84ff 55%,#64d2ff 100%)',
  'linear-gradient(140deg,#bf5af2 0%,#ff375f 100%)',
  'linear-gradient(140deg,#64d2ff 0%,#0a84ff 60%,#5e5ce6 100%)'
];

function hash (str) {
  let h = 0;
  const s = String(str || '');
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

hexo.extend.helper.register('clarity_gradient', function (post) {
  if (post && post.cover) return '';
  return 'background-image:' + GRADIENTS[hash(post && post.title) % GRADIENTS.length];
});

/* 封面上的字形：取标题里第一段有意义的英文/数字，没有就取首字 */
hexo.extend.helper.register('clarity_glyph', function (post) {
  const title = String((post && post.title) || '');
  const m = title.match(/[A-Za-z][A-Za-z0-9+#.\-]{1,}/);
  if (m) return m[0].slice(0, 9).toUpperCase();
  return title.slice(0, 1) || '·';
});

/* 判断导航项是否为当前页 */
hexo.extend.helper.register('clarity_is_active', function (current, target) {
  if (!target) return false;
  if (target === '/') return current === '/';
  return String(current).indexOf(target) === 0;
});
