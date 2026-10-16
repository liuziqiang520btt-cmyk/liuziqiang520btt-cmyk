# Clarity

> 一脉相承于 Apple 设计语言的 Hexo 主题

**Clarity（清晰）· Deference（内容优先）· Depth（层次）** —— 取自 Apple 人机界面指南的三块基石。

- **首屏图片封面**：整屏照片 + 渐变标题，导航栏浮在图片上自动转透明；滚动时**背景层做视差**（比页面慢 16%），前景文字反向快速上移并淡出
- **左侧个人栏**：头像 / 名字 / 简介 / 链接 / 统计，粘性跟随；窄屏自动折叠成内容上方的一张横卡
- **抽屉式目录**：右下角悬浮按钮唤出右侧圆角毛玻璃浮层（高度随目录内容），自动高亮当前章节；桌面和手机通用
- **毛笔标题**：封面标题可用自带的中文毛笔字体渲染；字体按实际用到的字做子集，只有 5.7 KB
- **玻璃卡片**：个人栏 / 精选大卡 / 文章列表 / 分类标签卡 / 作者卡 / 上下篇统一为半透明圆角玻璃（模糊 + 发丝描边 + 上边缘高光 + 软投影）
- 单栏阅读流，正文栏宽 716px（约 42 个汉字，最佳阅读行长）
- 毛玻璃导航栏，用 `backdrop-filter` 复刻 apple.com 的写法，不支持时自动降级为纯色
- 明暗双配色，跟随系统 + 手动切换，切换时不闪烁
- 代码块自动带语言标签和一键复制
- 无前端框架、无新增 npm 依赖、不外链任何字体服务

---

## 安装

1. 把 `themes/clarity` 放进你的 Hexo 站点。
2. 改站点根目录的 `_config.yml`：

```yaml
theme: clarity
```

3. 本主题用 Pug 写模板、Stylus 写样式，需要这两个渲染器：

```bash
npm install --save hexo-renderer-pug hexo-renderer-stylus
```

4. 建议同时关掉代码行号（苹果风更干净）：

```yaml
highlight:
  line_number: false
```

## 配置

主题默认值在 `themes/clarity/_config.yml`。**不要直接改它**——在站点根目录新建 `_config.clarity.yml`，写你想覆盖的项即可，这样升级主题不会丢配置。

```yaml
brand:
  show: true                    # 关掉就不显示左上角的图形标记 + 站点名

menu:
  主页: /
  文档: /archives/
  分类: /categories/
  标签: /tags/
  关于: /about/

accent: '#0071e3'
accent_dark: '#0a84ff'

# ---------- 首屏封面（仅首页） ----------
cover:
  enable: true
  image: /images/cover.jpg
  title:                        # 留空用站点 title；写 <br> 可以手动断行
  title_font: ''                # 留空用系统无衬线；brush 用自带的毛笔字体
  show_eyebrow: true            # 标题上方那行小字
  show_lede: true               # 标题下方那段描述
  subtitle:                     # 留空用 home.slogan / 站点 subtitle
  overlay: 0.42                 # 遮罩浓度 0–1：越大文字越清晰、图片越暗
  position: 0.45                # 纵向取景 0–1（0 顶部 / 1 底部）
  hint: true                    # 底部「向下滚动」提示

# ---------- 左侧个人栏 ----------
profile:
  enable: true
  avatar: /images/avatar.jpg
  name:                         # 留空用 config.author
  tagline: PostgreSQL · Greenplum · YMatrix
  bio: 把踩过的坑、读过的源码、想明白的原理，写在这里。
  stats: true                   # 三栏统计：文章 / 分类 / 照片
  sticky: true                  # 滚动时粘在视口里

home:
  highlight: '技术博客'          # 标题里这段文字做渐变高亮
  slogan: 学习笔记与踩坑记录      # 留空用站点 subtitle
  intro: ……                      # 留空用站点 description
  featured: true                # 首页精选大卡
  excerpt_length: 96            # 列表摘要字数

post:
  toc: true                     # 抽屉式目录
  word_count: true              # 字数（中文按字、西文按词）
  reading_time: true            # 预估阅读时长
  author_card: true             # 文末作者卡片
  show_category: true           # 文章顶部显示所属分类（那个小标签）
  author_avatar: ''             # 作者头像路径；留空则用作者名首字生成圆形色块
  nav: true                     # 上下篇
  copyright: false              # 版权声明
  outdated:
    enable: false
    days: 180

code:
  copy: true                    # 一键复制
  lang: true                    # 语言标签

lightbox: true                  # 正文图片点击放大

footer:
  since: 2025
  statistics: true
  powered: true

appearance:
  default: auto                 # auto | light | dark
  switch: true                  # 导航栏是否显示明暗切换按钮

motion: true                    # 滚动进入动效（封面视差也受它和系统"减少动态效果"控制）
smooth_scroll: true             # 锚点平滑滚动
```

单页禁用：在文章 Front-matter 里写 `sidebar: false` 关左侧个人栏。

## 液态玻璃卡片

**所有卡片共用一套材质**，定义在 `source/css/_glass.styl`：

> 个人栏 · 精选大卡 · 文章列表项 · 分类标签卡 · 作者卡 · 上下篇 · 版权块 · **手机菜单** · 目录抽屉 · 悬浮按钮

```css
background: var(--glass-bg);        /* 上亮下暗的半透明渐变 */
backdrop-filter: var(--glass-blur); /* blur(26px) saturate(190%) */
border: 1px solid var(--glass-edge);
box-shadow:
  inset 0 1px 0 var(--glass-hi),    /* 上边缘高光 */
  inset 0 -1px 0 var(--glass-lo),   /* 下边缘内反光 → 厚度 */
  var(--glass-shadow);
```

液态玻璃要"看得出是玻璃"，五个条件缺一不可：

| 条件 | 令牌 | 作用 |
| --- | --- | --- |
| 半透明底 | `--glass-bg` | 上亮下暗的渐变，比页面底色略亮或略暗 |
| 背景模糊 | `--glass-blur` | `blur(26px) saturate(190%)`，背景越花越明显 |
| 上边缘高光 | `--glass-hi` | 光打在玻璃棱上的亮线 —— **最关键的玻璃线索** |
| 下边缘内反光 | `--glass-lo` | 让玻璃有厚度，不是一张纸 |
| **页面环境光** | `--ambient-1/2/3` | **没有它，纯色底上模糊完全是白费的** |

> ⚠️ 最后一条最容易被忽略：玻璃必须**有背景可以透**。所以 `body` 上铺了三层很淡的径向渐变（右上蓝、左上紫、底部粉）。
> 如果把页面改成纯色，卡片会立刻退化成"普通白卡片"—— 这不是 bug，是物理。

> 不支持 `backdrop-filter` 的浏览器会自动退回不透明底（`@supports not`），不会出现"半透明底配深色文字看不清"的情况。

调参全在 `_tokens.styl`：`--glass-bg` 更透/更实、`--ambient-*` 环境光强弱、`--glass-blur` 模糊半径、`--glass-shadow` 投影深度。

## 毛笔标题字体

`cover.title_font: brush` 会用主题自带的毛笔字体渲染封面标题。

标题默认 `white-space: nowrap`，字号用 `clamp(20px, 6.9vw, 84px)` 跟着屏宽缩放，
所以**不管标题多长都保持一行且不溢出**（实测 360 / 390 / 430 / 480 / 600 / 768 / 900 / 1024 / 1280 / 1440 全通过）。
不想要这个行为，把 `_cover.styl` 里的 `white-space` 和 `clamp()` 去掉即可恢复自动换行。

字体是 **Zhi Mang Xing（钟齐志莽行书）**，来自 Google Fonts，**SIL Open Font License 1.1，可免费商用**（许可证全文在 `source/fonts/OFL.txt`）。

主题只**子集了实际用到的那几个字形**，所以整个字体文件只有 5.7 KB —— 不像整包中文字体动辄 5～10 MB。

> ⚠️ 子集是「按字生成」的：**改了标题文字，新字会回退到系统无衬线字体**。需要重新生成：
>
> ```bash
> curl "https://fonts.googleapis.com/css2?family=Zhi+Mang+Xing&text=你要写的字"
> ```
>
> 从返回的 CSS 里取出 `url(...)` 下载，覆盖 `themes/clarity/source/fonts/zhi-mang-xing.ttf` 即可。

想换别的毛笔字体？Google Fonts 上这几款同样是 OFL：

| 字体 | 风格 |
| --- | --- |
| Ma Shan Zheng 马善政毛笔楷书 | 笔锋最厚，工整易读 |
| **Zhi Mang Xing 钟齐志莽行书** | 倾斜连贯有气势，可读性好（默认） |
| Long Cang 龙藏 | 行草之间 |
| Liu Jian Mao Cao 柳建毛草 | 最接近狂草，但基本认不出字 |

> 真正的「毛体」（方正毛体）是**商业字体**，未经授权打包进仓库有法律风险，所以这里用的是免费替代方案。

## 封面视差是怎么做的

封面的背景不是 `background-image` 直接铺在 `.cover` 上，而是拆成了一个独立的 `.cover-bg` 图层：

```css
.cover          { overflow: hidden; }          /* 裁掉溢出 */
.cover-bg       { top: -16%; height: 132%; }   /* 上下各多留 16% 位移余量 */
```

滚动时 JS 只改 `transform`（GPU 合成，不触发重排）：

| 图层 | 位移 | 效果 |
| --- | --- | --- |
| `.cover-bg` | `translateY(+0.16 × scrollY)` | 净速度 0.84×，比页面慢 → 显得远 |
| `.cover-inner` | `translateY(-0.06 × scrollY)` | 净速度 1.06×，比页面快 → 显得近 |
| 文字透明度 | `1 - scrollY / 高度 × 1.25` | 滚到底部时刚好淡出 |

开启系统「减少动态效果」（`prefers-reduced-motion`）时，视差会自动关闭，只保留静态封面。

## 放图片

把封面和头像放进站点的 `source/images/`，Hexo 会把它们原样复制到站点根：

```
source/images/cover.jpg     ← 首页首屏封面（建议 1600px 宽以上的横构图）
source/images/avatar.jpg    ← 左侧个人栏头像（正方形，建议 480×480）
source/images/author.jpg    ← 文章头部 + 文末作者卡的头像（正方形，建议 320×320）
```

文章封面可以在 Front-matter 里写 `cover: /images/xxx.jpg`；不写就按标题自动生成渐变封面。

### 文章里的插图（Typora 用户必读）

Typora 粘贴图片时，默认会把图片拷到 `C:\Users\你\AppData\Roaming\Typora\typora-user-images\`，
并往 Markdown 里写这个**本地绝对路径**。这个目录不在博客仓库里，所以推送后图片一定是死链。

**不要动 Typora 的全局设置** —— `文件 → 偏好设置 → 图像` 里的设置对**所有文档**生效，
一旦指向博客目录，你在 Typora 里写的私人笔记、随手记，图片也全会倒进博客仓库。

正确做法是用 **`typora-copy-images-to`（按文档覆盖）** —— 写在文章自己的 front-matter 里：

```yaml
---
title: 我的文章
date: 2026-10-14 17:00:00
typora-copy-images-to: ../images
---
```

`../images` 是相对文章所在目录（`source/_posts/`）的路径，也就是博客的 `source/images/`。
**这样只有博客文章会把图片拷进仓库，其它文档照旧走 Typora 的默认目录，互不干扰。**

新文章由 `scaffolds/post.md` 自动带上这一行，不用每次手写。

> 图形化做法：菜单 `格式 → 图像 → 插入本地图片时 → 复制图片到文件夹`，选到 `source/images`，
> Typora 会自动往**当前文档**的 front-matter 写入正确的相对路径。

站点根目录的 `scripts/media.js` 会把渲染出的图片路径统一规范成 `/images/<文件名>`，
所以 Typora 写的 `../images/xxx.png`、甚至漏改的 `C:\...\xxx.png` 都能正常显示。

> **兜底**：万一忘了设置，`C:\...` 这种本地绝对路径会被自动收进 `source/images/`，并在控制台提醒
> `已把图片收进 source/images/xxx.png —— 记得 git add 一起提交`。
> 这时**必须 `git add` 并提交**，否则 GitHub Actions 上没有这个文件，线上依然是死链。

> **注意体积**：Typora 直接粘截图动辄好几 MB（一张 4032×3024 的 PNG 有 8.6 MB）。
> 下面有一套**常驻守卫**会自动帮你压。

> 想关掉这套规范化（例如改用 Hexo 原生的 `post_asset_folder`），在 `_config.yml` 里加
> `clarity_media: { normalize: false }` —— 两者不要同时用。

## 关于页

在页面的 front-matter 里写 `type: about` 就会启用专门版式：

```yaml
---
title: 关于
type: about
---
```

版式由四块组成：**封面横幅 → 压边的头像卡 → 数字条 → 正文 + 研究动态时间线**。

```yaml
about:
  cover: /images/cover.jpg      # 顶部横幅，留空用 cover.image
  avatar: ''                    # 留空用个人栏头像
  name: ''                      # 留空用个人栏名字
  tagline: ''                   # 留空用个人栏副标题
  research_title: 研究动态
```

### 研究动态（按文章自动生成）

从最新文章往前取（条数由 `about.research_count` 控制，默认 12），每条显示：

| 位置 | 内容 |
| --- | --- |
| 日期 | 文章的发布日期 |
| 标题 | 文章标题，可点进文章 |
| 摘要 | front-matter 里的 `summary`，**没写就不显示这一行** |
| 底栏 | 先「主题」（分类），再标签 |

所以在文章 front-matter 里加一行摘要即可：

```yaml
---
title: 查询优化器的代价估算
categories:
  - PostgreSQL
tags:
  - 优化器
summary: 看统计信息怎么一步步影响最终选出来的执行计划。
---
```

`hexo new` 生成的文章已经自带 `summary:` 空字段（见 `scaffolds/post.md`）。

### 活动热力图

按 **git 提交频率**渲染最近 **26 周（约 6 个月）**，周日 → 周六，配色 5 档，右下角带「少 → 多」图例。

- 数据来自 `scripts/git-heatmap.js` 调用的 `git log`
- 窗口长度由该文件顶部的 `WEEKS` 常量控制（默认 26）
- 「近半年 N 次提交」里的 N **只统计窗口内**，不是仓库历史总提交数
- 26 列的宽度是弹性的（撑满面板），格子用 `aspect-ratio` 保持正方形
- ⚠️ **CI 必须完整克隆**：`actions/checkout` 默认浅克隆（只有 1 条记录），
  `pages.yml` 里已加 `fetch-depth: 0`；去掉它热力图会变空
- 想关掉：删掉 `about.pug` 里 `if hm && hm.available` 那一整段即可
- 配色想换：改 `_about.styl` 里 `.hm-day.lv1` ～ `.lv4` 的四个色值

正文（自我介绍等）直接写在 `source/about/index.md`，就是普通 Markdown。

### 图片自动压缩（常驻守卫）

| 命令 | 作用 |
| --- | --- |
| `npm run img:watch` | 常驻监听，往 `source/images/` 里丢图就自动压 |
| `npm run img` | 立刻把 `source/images/` 下所有图压一遍 |
| `npm run img:dry` | 只报告会压多少，不动文件 |
| `npm run img:cat` | 手动收一次图（把散落在文章旁边的图片收进 `source/images/`） |
| `npm run img:jpg` | 更狠：把无透明通道的 PNG 转成 JPEG |
| `npm run save` | 一键「收图 → 压缩 → 提交 → 推送」 |
| `npm run img:autostart` | 装开机自启（登录后在后台静默运行） |
| `npm run img:noautostart` | 卸掉开机自启 |

**规则**

- 宽度超过 1600px 或体积超过 200 KB 才处理
- 压完必须至少小 15% 才写回 —— 避免反复重压、画质逐次劣化
- `img:watch` **不改变文件名和后缀**，所以 Markdown 引用永远不用改，
  也不会和正在编辑的 Typora 抢文件
- `img:jpg` 会把 `x.png` 变成 `x.jpg` 并同步改掉引用；万一漏改（比如 Typora 又把旧内容存了回去），
  `scripts/media.js` 还会按 `source/images/` 下**实际存在的文件后缀**兜底解析，不会出死链

**实测**（同一张 4032×3024、8.6 MB 的截图）：

| 处理方式 | 结果 |
| --- | --- |
| `img:watch`（保持 PNG） | 8.6 MB → **851 KB**（-90%） |
| `img:jpg`（转成 JPEG） | 8.6 MB → **200 KB**（-98%） |

> 日志写在仓库根目录的 `.img-watch.log`（已 gitignore）。
> **为什么不用 git 钩子**：试过 `pre-commit`，但 GitHub Desktop 传给钩子的环境里
> 中文用户名会编码错乱（`刘自强` → `刘??`），git 读 `$HOME/.config/git/config` 直接 fatal，
> 提交被中断 —— 而且**在钩子被调用之前就挂了**，钩子里做什么都救不回来。
> 所以改为**后台常驻监听轮询**：完全不经过 git，GUI 工具是什么都不影响。
>
> `img:watch` 每 4 秒扫一次 `source/_posts`，发现新图立刻复制进 `source/images/`（原文件保留），
> 然后压缩。Typora 的「复制图片到 ./assets 文件夹」放出来的图会被自动接住。
>
> 建议流程：让 `img:watch` 常驻 → 正常写文章粘图 → 提交（`npm run save` 更省事）。

**文章头像**有两处（文章标题下那行、以及文末的作者卡），由 `post.author_avatar` 统一控制：

```yaml
post:
  author_avatar: /images/author.jpg   # 填路径就用图片
  show_category: false                # 不要文章顶部的分类小标签
```

> `author_avatar` 留空时会退回「作者名首字」的蓝色圆形色块，所以不换图片也不影响。
> 这两个开关都是**全局**的，写在 `_config.clarity.yml` 里，之后新写的文章自动生效，不用每篇都改。

## 需要建的页面

`/categories/`、`/tags/` 这些列表页要手动建（Hexo 的生成器只生成「某个分类」的页面）：

```markdown
<!-- source/categories/index.md -->
---
title: 分类
type: categories
---

<!-- source/tags/index.md -->
---
title: 标签
type: tags
---

<!-- source/404.md —— GitHub Pages 会读根目录的 404.html -->
---
title: 页面不存在
permalink: /404.html
type: 404
---
```

## 文章 Front-matter

```yaml
---
title: PostgreSQL 执行计划里那些反直觉的地方
date: 2026-03-18 10:00:00
categories:
  - PostgreSQL
tags:
  - 调优
  - 原理
# cover: /images/xxx.jpg   # 可选。不填就按标题自动生成渐变封面
# sidebar: false           # 可选，单篇关左侧个人栏
---
```

## 文件结构

```
clarity/
├── _config.yml              主题默认配置
├── languages/               中文 / 英文文案
├── scripts/helpers.js       注册给模板用的辅助函数（字数、摘要、渐变、阅读时长）
├── layout/
│   ├── includes/layout.pug  基座（导航栏 + 封面插槽 + 栅格 + 页脚）
│   ├── includes/cover.pug   首屏封面（含视差层）
│   ├── includes/profile.pug 左侧个人栏
│   ├── includes/            head / nav / footer / 分页 / 卡片 mixin
│   ├── index.pug            首页
│   ├── post.pug             文章页（含目录抽屉）
│   ├── page.pug             独立页面（含分类 / 标签 / 404）
│   ├── archive.pug          文档
│   ├── category.pug         分类详情
│   └── tag.pug              标签详情
└── source/
    ├── css/                 Stylus：tokens → fonts → base → 各组件
    ├── fonts/               毛笔字体子集（5.7 KB）+ OFL 许可证
    └── js/clarity.js        全部交互，无依赖
```

## 设计令牌

所有颜色、字体、圆角、阴影、缓动、栅格宽度都收在 `source/css/_tokens.styl` 里。要改视觉，先改这里。

| 令牌 | 明色 | 暗色 |
| --- | --- | --- |
| `--bg` | `#ffffff` | `#000000` |
| `--bg-subtle` | `#f5f5f7` | `#0b0b0c` |
| `--text` | `#1d1d1f` | `#f5f5f7` |
| `--text-2` | `#6e6e73` | `#a1a1a6` |
| `--text-3` | `#86868b` | `#86868b` |
| `--separator` | `rgba(0,0,0,.10)` | `rgba(255,255,255,.14)` |
| `--accent` | `#0071e3` | `#0a84ff` |
| `--maxw` | `1240px`（整站容器宽） | 同 |
| `--rail` | `224px`（左侧个人栏宽） | 同 |
| `--readw` | `716px`（正文栏宽） | 同 |
| `--drawer-w` | `320px`（目录抽屉宽） | 同 |
| `--glass-bg` | `rgba(241,241,244,.78)` | `rgba(255,255,255,.068)` |
| `--glass-line` | `rgba(0,0,0,.07)` | `rgba(255,255,255,.11)` |
| `--glass-hi` | `rgba(255,255,255,.95)`（上边缘高光） | `rgba(255,255,255,.09)` |
| `--ambient-1/2` | 页面角落的极淡环境光 | 同 |

字体栈：`-apple-system` / SF Pro / 苹方 优先，跨平台回退系统中文字体，代码用 `ui-monospace` / SF Mono。**不加载任何外部字体**。

> ⚠️ 写 Stylus 时注意：`min()` / `max()` 是 **Stylus 的内置函数**，会把你写的 `min(84px, 6.9vw)` 直接求值掉（丢掉其中一个值）。
> 用 `width` + `max-width` 代替，或者直接用 `clamp()` —— `clamp()` 不是 Stylus 内置函数，可以放心用。
>
> 同样要注意 CSS **层叠顺序**：移动端 `@media` 里的 `.cover-title { font-size: 40px }` 会盖掉后面写的
> `.cover-title--brush`（同优先级、位置更靠后），所以那条已经改成 `.cover-title:not(.cover-title--brush)`。

## 断点

| 宽度 | 变化 |
| --- | --- |
| > 1180px | 左侧个人栏 + 内容两栏 |
| ≤ 1180px | 个人栏折叠成内容上方的一张横卡 |
| ≤ 860px | 导航折叠成汉堡菜单，封面与正文标题字号下调 |

目录抽屉在**所有宽度**下都可用。

## 无障碍

- 语义化标签 + 正确的标题层级
- 全站键盘可达，`:focus-visible` 有清晰焦点环，导航有 skip-link
- 目录抽屉：打开时焦点移到关闭按钮、锁滚动，`Esc` / 点遮罩 / 选目录项都能关闭，关闭后焦点回到悬浮按钮
- 封面上有图片遮罩，白色文字对比度达标
- 明暗两套配色的正文对比度均达到 WCAG AA 以上
- 完整尊重 `prefers-reduced-motion`（视差与滚动动效自动关闭）

## 性能

| 指标 | 实测 |
| --- | --- |
| `css/clarity.css` | 约 38 KB（未压缩） |
| `js/clarity.js` | 约 19 KB（未压缩） |
| 首屏外部请求 | 2（HTML + CSS）+ 1（JS，defer）+ 1（封面图，preload） |
| 视差实现 | 只改 `transform`，GPU 合成，rAF 节流 |
| 毛笔标题字体 | 5.7 KB，自托管子集，无外部请求 |
| 外部字体 / CDN / 框架 | 0 |

## 许可

MIT
