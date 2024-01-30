# 简介

这是一个专注于**静态博客**场景下 **Markdown 文件批处理**的纯 ES 模块（也就是.mjs），仅支持 Nodejs，批量地将 Markdown 数据以特定格式存储在 JSON 文件中，针对博客场景，提供索引、分页功能。

文档列表 / Documents list：

- [中文](/README.md)
- [English](/README_EN.md)

# 功能

已实现：

- 数据查询：
  - 文章详情：批量解析 markdown 文件（支持 Front Matter），生成`post_[hash].json`中（hash 指 markdown 文件的哈希值）；
  - 文章索引：生成`posts.json`，包含所有博客文章的基本信息，长内容会按行数或按特殊标记（如`<!--more-->`）截取出摘要；
  - 分页：将`posts.json`中的数据分割到若干 JSON 文件中，生成`posts_[page].json`（page 为页码）；
- 性能优化：
  - 首次执行后，后续再次执行时会比对 HASH 值，跳过已处理过的文件；
  - 分页功能可以实现按需加载；
- 类型检查：完整的 Typescript 类型定义，良好的代码提示；

TODO List：

- JSON 文件压缩；

# 安装

```bash
npm install oaks-post
```

# 使用

调用如下：

```js
import { PostsProcessor } from "oaks-post";

// Define your directories
const markdownDirectory = "markdownFiles";
const jsonDirectory = "jsonFiles";

const posts = new PostsProcessor({
  baseUrl: "https://neil-ji.github.io/",
  markdownDirectory,
  jsonDirectory,
  descending: true,
  maxItems: 3,
});
await posts.processFiles();
```

举例，markdown 文件如下：

```markdown
---
title: 数算再回顾（一）二叉树性质
date: 2023-07-25 14:40:00
tag: leetcode
---

## 前言

数（据结构）算（法）再回顾，加深记忆抗遗忘。

## 基本性质

1. 非空二叉树的叶子节点数，等于度为 2 的节点数加 1；
2. 第 k 层至多有 `2^(k − 1)` 个节点（每层节点数可构成公比为 2 的等比数列）；
3. 高度为 h，至多有 `2^ℎ − 1`；
4. n 个节点的二叉链表，有 n+1 个空链域（左或右孩子指针为 NULL）；

[注]：节点的度就是节点的子节点个数，或称分支个数，考研爱考，算法题没见过。

## 满、完全二叉树性质

前提：根节点为 1，逐层从左到右编号，当前节点为 i；

（一）父子节点间的关系：

- 父节点：`⌊i / 2⌋`；
- 左子：`2 * i`；
- 右子：`2 * i + 1`；

（二）若`i ≤ ⌊n / 2⌋`，则节点 i 为分支节点，否则为叶子节点。

（三）对于完全二叉树，从 1 往后遍历，若找到第一个没有右孩子的节点 i，则大于 i 的节点都是叶子节点。

[注]:数学符号`⌊ x ⌋`意思是向下取整；

## 二叉树的顺序存储

满、完全二叉树按照从根到叶，从左到右的顺序，依次存入一维数组（从数组下标 1 开始存，舍弃 0，则直接照搬前述父子编号关系式即可）。

其他二叉树添加空节点，构造成完全二叉树，再按上述顺序存入一维数组。
```

所生成的对应 JSON 文件如下：

```json
// YOUR_PROJECT_DIRECTORY\jsonFiles\post_a5d78676.json
{
  "frontMatter": {
    "title": "数算再回顾（一）二叉树性质",
    "date": "2023-07-25T14:40:00.000Z",
    "tag": "leetcode"
  },
  "content": "\r\n## 前言\r\n\r\n数（据结构）算（法）再回顾，加深记忆抗遗忘。\r\n\r\n## 基本性质\r\n\r\n1. 非空二叉树的叶子节点数，等于度为 2 的节点数加 1；\r\n2. 第 k 层至多有 `2^(k − 1)` 个节点（每层节点数可构成公比为 2 的等比数列）；\r\n3. 高度为 h，至多有 `2^ℎ − 1`；\r\n4. n 个节点的二叉链表，有 n+1 个空链域（左或右孩子指针为 NULL）；\r\n\r\n[注]：节点的度就是节点的子节点个数，或称分支个数，考研爱考，算法题没见过。\r\n\r\n## 满、完全二叉树性质\r\n\r\n前提：根节点为 1，逐层从左到右编号，当前节点为 i；\r\n\r\n（一）父子节点间的关系：\r\n\r\n- 父节点：`⌊i / 2⌋`；\r\n- 左子：`2 * i`；\r\n- 右子：`2 * i + 1`；\r\n\r\n（二）若`i ≤ ⌊n / 2⌋`，则节点 i 为分支节点，否则为叶子节点。\r\n\r\n（三）对于完全二叉树，从 1 往后遍历，若找到第一个没有右孩子的节点 i，则大于 i 的节点都是叶子节点。\r\n\r\n[注]:数学符号`⌊ x ⌋`意思是向下取整；\r\n\r\n## 二叉树的顺序存储\r\n\r\n满、完全二叉树按照从根到叶，从左到右的顺序，依次存入一维数组（从数组下标 1 开始存，舍弃 0，则直接照搬前述父子编号关系式即可）。\r\n\r\n其他二叉树添加空节点，构造成完全二叉树，再按上述顺序存入一维数组。\r\n"
}
```

```json
// YOUR_PROJECT_DIRECTORY\jsonFiles\posts.json
{
  "buildTime": "2024-01-30T07:55:28.259Z",
  "posts": [
    // others...
    {
      "url": "https:/neil-ji.github.io/test_json/post_a5d78676.json",
      "hash": "a5d78676",
      "frontMatter": {
        "title": "数算再回顾（一）二叉树性质",
        "date": "2023-07-25T14:40:00.000Z",
        "tag": "leetcode"
      },
      "excerpt": "## 前言\r\n\n数（据结构）算（法）再回顾，加深记忆抗遗忘。\r\n\n## 基本性质\r\n\n1. 非空二叉树的叶子节点数，等于度为 2 的节点数加 1；\r\n2. 第 k 层至多有 `2^(k − 1)` 个节点（每层节点数可构成公比为 2 的等比数列）；"
    }
    // others...
  ]
}
```

```json
// YOUR_PROJECT_DIRECTORY\jsonFiles\posts_1.json
{
  "current": 1,
  "posts": [
    // others...
    {
      "url": "https:/neil-ji.github.io/test_json/post_a5d78676.json",
      "hash": "a5d78676",
      "frontMatter": {
        "title": "数算再回顾（一）二叉树性质",
        "date": "2023-07-25T14:40:00.000Z",
        "tag": "leetcode"
      },
      "excerpt": "## 前言\r\n\n数（据结构）算（法）再回顾，加深记忆抗遗忘。\r\n\n## 基本性质\r\n\n1. 非空二叉树的叶子节点数，等于度为 2 的节点数加 1；\r\n2. 第 k 层至多有 `2^(k − 1)` 个节点（每层节点数可构成公比为 2 的等比数列）；"
    }
    // others...
  ]
}
```

注意，对于分页的 JSON 数据，如果没有前或后页，也不会有 prev 或 next 字段。

# 配置参数

你可以传入一个对象以控制 PostsProcessor 的部分行为，该对象的 TS 类型定义如下：

```ts
interface PostsProcessorOptions {
  baseUrl?: string;
  markdownDirectory: string;
  jsonDirectory: string;
  descending?: boolean;
  excerptOptions?: PostsExcerptOptions;
  maxItems?: number;
}

interface PostsExcerptOptions {
  rule: PostsExcerptRule;
  lines?: number;
  tag?: string;
}

enum PostsExcerptRule {
  ByLines = 1,
  CustomTag = 2,
}
```

以下为各字段含义：

- `markdownDirectory: string`必填，可传入相对或绝对路径，解析相对路径将默认以`process.cwd()`为参照物，它代表你的 markdown 文件所在目录。
- `jsonDirectory: string`：必填，解析规则同`markdownDirectory`，它代表`oaks-post`输出的 json 文件的存放目录。
- `baseUrl?: string`：可选，默认为空字符串`""`，它将作为 posts.json 中各 post 的 url 前缀。
- `descending?: boolean`：可选，默认为`false`，它决定了`posts.json`中 posts 数组的排列顺序；
- `excerptOptions?: object`可选：
  - `rule: PostsExcerptRule`：必填，枚举类型，可选值如下：
    - `PostsExcerptRule.ByLines`：默认为按行截取 markdown 内容。
    - `PostsExcerptRule.`：可选按自定义标记截取 markdown 内容。
  - `lines?: number`：可选，指定所截取内容的行数，空行不计，代码块视作一行。
  - `tag?: string`：可选，截取到指定标记，默认为`<!--more-->`，这是`hexo`通用的摘要截取标记。
- `maxItems?: number`：可选，指定该值将开启分页功能，默认不启用分页，小于 0 时将使用默认值 10；
