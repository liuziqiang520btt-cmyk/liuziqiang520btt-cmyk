// ============================================================
// 图片压缩守卫的开机自启开关
//
//   node tools/img-autostart.js on      装（登录后自动在后台跑）
//   node tools/img-autostart.js off     卸
//   node tools/img-autostart.js status  看现在什么状态
//
// 原理：往 Windows 启动目录放一个 .vbs，由它静默拉起 node 进程。
// 注意 node 不在系统 PATH 上，所以 vbs 里写的是 node 的绝对路径。
// ============================================================

const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = path.join(__dirname, '..');
const NAME = 'clarity-img-watch.vbs';
const STARTUP = path.join(os.homedir(), 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
const TARGET = path.join(STARTUP, NAME);

const cmd = process.argv[2] || 'status';
const Q = String.fromCharCode(34);          // 双引号
const CRLF = String.fromCharCode(13, 10);

function makeVbs() {
  const node = process.execPath;
  const script = path.join(ROOT, 'tools', 'compress-images.js');
  // 用 charCode 拼引号，避免多层转义把变量名写成字面文本
  const inner = Q + node + Q + ' ' + Q + script + Q + ' --watch';
  // VBScript 字符串里要表示一个双引号，必须写两个
  const escaped = inner.split(Q).join(Q + Q);
  // 0 = 隐藏窗口；False = 不等待
  return 'CreateObject(' + Q + 'WScript.Shell' + Q + ').Run ' + Q + escaped + Q + ', 0, False' + CRLF;
}

if (cmd === 'on') {
  if (!fs.existsSync(STARTUP)) { console.error('找不到启动目录: ' + STARTUP); process.exit(1); }
  fs.writeFileSync(TARGET, makeVbs(), 'utf8');
  console.log('已安装开机自启: ' + TARGET);
  console.log('下次登录后会自动在后台运行；想立刻生效，双击这个 vbs 或跑 npm run img:watch');
} else if (cmd === 'off') {
  if (fs.existsSync(TARGET)) { fs.unlinkSync(TARGET); console.log('已卸载: ' + TARGET); }
  else console.log('本来就没装');
} else {
  console.log(fs.existsSync(TARGET) ? '开机自启：已开启' + CRLF + '  ' + TARGET : '开机自启：未开启');
}
