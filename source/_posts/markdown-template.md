---
title: Markdown 写作模板
date: 2026-08-30 10:00:00
categories:
  - 工具
tags:
  - Markdown
  - 写作
summary: 写技术文章时常用的几个 Markdown 片段，复制走就能用。
---

写技术文章时常用的几个 Markdown 片段，复制走就能用。

## 标题层级

一级标题由文章标题自动生成，正文里从 `##` 开始用。右侧目录只收录到三级标题。

```markdown
## 二级标题
### 三级标题
#### 四级标题
```

## 强调

行内代码用反引号包起来，比如 `SELECT * FROM pg_stat_activity`。**加粗**用于强调结论，*斜体*用于术语。

## 引用

> 引用适合放结论、官方文档原话，或者需要读者特别注意的前提条件。
>
> 可以有多段。

## 表格

| 现象 | 根因 | 处方 |
| --- | --- | --- |
| 估算行数差 100 倍 | 列间相关性未建模 | `CREATE STATISTICS` |
| 近期数据选择率偏低 | 统计信息过期 | 调低 analyze 阈值 |
| 函数包裹列不走索引 | 表达式索引缺失 | 建表达式索引 |

## 代码块

带上语言名，代码块左上角就会显示对应的标签：

```sql
CREATE STATISTICS orders_customer_created (dependencies)
ON customer_id, created_at FROM orders;
```

```python
import psycopg
with psycopg.connect("dbname=blog") as conn:
    rows = conn.execute("SELECT count(*) FROM orders").fetchone()
    print(rows)
```

## 分隔线

---

以上。
