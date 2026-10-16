// ============================================================
// 活动热力图：按 git 提交频率生成
//
// 由 scripts/ 目录加载（Hexo 插件目录），注册 clarity_heatmap 助手。
// 数据来自 git log，所以 CI 上必须完整克隆（fetch-depth: 0）。
// ============================================================

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 只展示最近多少周。26 周 ≈ 6 个月
const WEEKS = 26;

const CANDIDATES = [
  'git',
  'C:/Program Files/Git/cmd/git.exe',
  'C:/Program Files (x86)/Git/cmd/git.exe'
];

let cache = null;

const pad = function (n) { return String(n).padStart(2, '0'); };
const key = function (d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };

function readDates() {
  const args = ['-C', hexo.base_dir, 'log', '--no-merges', '--pretty=format:%ad', '--date=short'];
  for (const bin of CANDIDATES) {
    try {
      const out = execFileSync(bin, args, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, timeout: 20000 });
      return String(out).split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean);
    } catch (e) { /* 换下一个 */ }
  }
  return [];
}

function levelOf(n) {
  if (!n) return 0;
  if (n === 1) return 1;
  if (n <= 3) return 2;
  if (n <= 6) return 3;
  return 4;
}

const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

function build() {
  const dates = readDates();
  const counts = {};
  for (const d of dates) counts[d] = (counts[d] || 0) + 1;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // 网格以「周六」结尾，行是周日→周六（和 GitHub 一致）
  const end = new Date(today);
  end.setDate(end.getDate() + (6 - end.getDay()));
  const start = new Date(end);
  start.setDate(start.getDate() - (WEEKS * 7 - 1));

  const weeks = [];
  let week = [];
  let lastMonth = -1;
  const months = [];

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const k = key(d);
    const n = counts[k] || 0;
    if (d.getDay() === 0) {
      // 这一列的第一天，决定月标签
      let label = '';
      const firstOfMonth = new Date(d);
      firstOfMonth.setDate(firstOfMonth.getDate() + 0);
      if (d.getMonth() !== lastMonth) {
        lastMonth = d.getMonth();
        label = MONTHS[lastMonth];
      }
      weeks.push({ label: label, days: [] });
      week = weeks[weeks.length - 1].days;
    }
    week.push({ date: k, count: n, level: levelOf(n), future: d > today });
  }

  // 注意：不能裁剪开头空白的周 —— 日历格必须连续，
  // 一旦删掉前几列，整张图就只剩有提交的那几周了。

  // 统计只算窗口内的 —— 不能用 dates.length，
  // 那是整个仓库历史的提交数，会把「近半年」说得过大。
  let total = 0;
  let days = 0;
  for (const w of weeks) {
    for (const d of w.days) {
      if (d.future) continue;
      if (d.count) { total += d.count; days += 1; }
    }
  }

  return {
    weeks: weeks,
    total: total,
    days: days,
    available: total > 0
  };
}

// 每次生成前清一次缓存。
// 否则 hexo server 常驻进程会一直用第一次读到的 git log，
// 期间新提交的 commit 不会反映到热力图上（要重启才更新）。
hexo.on('generateBefore', function () {
  cache = null;
});

hexo.extend.helper.register('clarity_heatmap', function () {
  if (!cache) cache = build();
  return cache;
});
