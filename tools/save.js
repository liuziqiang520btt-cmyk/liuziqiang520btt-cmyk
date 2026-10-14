// ============================================================
// 一键：收图 → 压缩 → 提交 → 推送
//
//   npm run save
//
// 完全不依赖 git 钩子，所以 GUI 工具（GitHub Desktop 等）不执行钩子也没关系。
// ============================================================

const { execFileSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const NODE = process.execPath;

function findGit() {
  const cands = [
    'C:/Program Files/Git/cmd/git.exe',
    'C:/Program Files (x86)/Git/cmd/git.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Programs/Git/cmd/git.exe')
  ];
  for (const c of cands) { if (c && fs.existsSync(c)) return c; }
  return 'git';
}
const GIT = findGit();

function git(args, opts) {
  return execFileSync(GIT, ['-C', ROOT].concat(args), Object.assign({ encoding: 'utf8' }, opts || {}));
}

console.log('1/4 收图片…');
spawnSync(NODE, [path.join(__dirname, 'harvest-images.js')], { stdio: 'inherit' });

console.log('2/4 压缩…');
spawnSync(NODE, [path.join(__dirname, 'compress-images.js')], { stdio: 'inherit' });

console.log('3/4 暂存…');
git(['add', '-A']);

const staged = git(['diff', '--cached', '--name-only']).split('\n').filter(Boolean);
if (!staged.length) {
  console.log('没有需要提交的改动。');
  process.exit(0);
}

let msg;
if (staged.length === 1) msg = '更新 ' + path.basename(staged[0]);
else msg = '更新 ' + staged.length + ' 个文件';

console.log('4/4 提交并推送…');
git(['commit', '-m', msg], { stdio: 'inherit' });

for (let i = 1; i <= 3; i++) {
  const r = spawnSync(GIT, ['-C', ROOT, 'push', 'origin', 'main'], { stdio: 'inherit' });
  if (r.status === 0) { console.log('推送成功 ✓'); process.exit(0); }
  console.log('推送失败，第 ' + i + ' 次重试…');
}
console.log('推送仍然失败，稍后可以手动跑 git push origin main');
process.exit(1);
