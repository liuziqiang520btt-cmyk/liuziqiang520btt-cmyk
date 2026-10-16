---
title: Hexo 常用命令速查
date: 2026-09-20 10:00:00
categories:
  - 工具
tags:
  - Hexo
summary: 把最常用的几条命令记在这里，省得每次都去翻文档。
---

把最常用的几条命令记在这里，省得每次都去翻文档。

## 日常三件套

```bash
hexo new "文章标题"    # 新建文章
hexo server           # 本地预览 http://localhost:4000
hexo generate         # 生成静态文件到 public/
```

## 清理与重新生成

改过主题配置或者遇到诡异的缓存问题时：

```bash
hexo clean && hexo generate
```

> `hexo clean` 会删掉 `public/` 和 `db.json`。`db.json` 是 Hexo 的缓存数据库，删掉之后下次生成会重建，不会影响源文件。

## 草稿

```bash
hexo new draft "还没写完的想法"   # 存到 source/_drafts/
hexo publish "还没写完的想法"     # 移动到 source/_posts/
hexo server --draft              # 本地预览时把草稿也渲染出来
```

## 文章开头的 Front-matter

| 字段 | 说明 | 示例 |
| --- | --- | --- |
| `title` | 标题 | `PostgreSQL 执行计划` |
| `date` | 发布时间 | `2025-03-18 10:00:00` |
| `categories` | 分类，可多个 | `PostgreSQL` |
| `tags` | 标签，可多个 | `调优`、`原理` |
| `updated` | 更新时间 | 留空则取文件修改时间 |

## 部署

这个站点用的是 GitHub Actions：往 `main` 分支推一次代码，云端会自动 `npm install` → `hexo generate` → 发布到 GitHub Pages。本地不需要手动 deploy。

```bash
git add -A
git commit -m "新的文章"
git push
```
