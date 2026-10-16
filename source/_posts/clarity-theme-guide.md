---
title: Clarity 主题使用指南
date: 2026-10-08 10:00:00
categories:
  - 博客
tags:
  - Hexo
  - 主题
summary: 从设计原则到配置文件，把主题的用法和调参位置一次讲清。
---

这个站点用的主题叫 **Clarity**，是一套遵循 Apple 人机界面指南的 Hexo 主题。它只有三个设计目标：**清晰**、**内容优先**、**有层次**。

## 设计原则

主题里的每一个决定都能追溯到 Apple HIG 的三块基石：

| 原则 | 原意 | 具体做法 |
| --- | --- | --- |
| Clarity | 文字清晰易读 | 正文栏宽锁定 716px，约 42 个汉字 |
| Deference | 界面不与内容竞争 | 去掉侧边栏，全站单栏流 |
| Depth | 用层级传达结构 | 毛玻璃导航栏、发丝描边分层 |

## 配置文件放在哪里

主题默认值在 `themes/clarity/_config.yml`，你的个性化设置写在站点根目录的 `_config.clarity.yml` 里。后者会覆盖前者，所以升级主题不会丢失你的配置。

```yaml
home:
  highlight: '技术博客'
  slogan: 学习笔记与踩坑记录
  featured: true

appearance:
  default: auto   # auto | light | dark
```

## 本地预览

```bash
# 启动本地服务器，默认 http://localhost:4000
npx hexo server

# 只生成静态文件
npx hexo generate
```

> 导航栏右上角的圆形按钮可以切换明暗外观，你的选择会被记住；如果没手动切过，就跟随系统。

## 文章里可以用的写法

普通 Markdown 都支持，另外：

- 代码块会自动带**语言标签**和**一键复制**按钮
- 宽表格在小屏幕上会自动变成横向滚动，不会撑破布局
- 正文里的图片可以点击放大
- 右侧目录会自动高亮你正在读的章节

```sql
-- 顺便放一段 SQL，看看代码块长什么样
EXPLAIN (ANALYZE, BUFFERS)
SELECT o.id, c.name
FROM orders o
JOIN customers c ON c.id = o.customer_id
WHERE o.created_at > now() - interval '7 days';
```
