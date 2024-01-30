# Introduce

This is a pure ES module (`.mjs`) focused on **Markdown file batch processing** in the **static blog** scenario, exclusively supporting Node.js. It processes Markdown data in bulk and stores it in JSON files in a specific format. Tailored for blog scenarios, it provides indexing and pagination functionality.

Document list:

- [中文](/README.md)
- [English](/README_EN.md)

# Features

Implemented:

- Data retrieval:
  - Article details: Batch parsing of Markdown files (supporting Front Matter), generating `post_[hash].json` (where hash refers to the hash value of the Markdown file).
  - Article index: Generates `posts.json`, containing basic information of all blog articles. Long content is truncated either by line count or by a special marker (e.g., `<!--more-->`).
  - Pagination: Splits the data from `posts.json` into several JSON files, generating `posts_[page].json` (where page is the page number).
- Performance optimization:
  - After the initial execution, subsequent executions will compare hash values and skip files that have been processed before.
  - Pagination allows for on-demand loading.
- Type checking: Complete TypeScript type definitions, providing excellent code hints.

TODO List:

- JSON file compression.

# Install

```bash
npm install oaks-post
```

# Usage

Use as follows:

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

For example, the Markdown file is as follows:

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

The corresponding generated JSON file is as follows:

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

Note that for paginated JSON data, if there is no previous or next page, there will be no 'prev' or 'next' fields.

# Configuration Parameters

You can pass an object to control some behaviors of the PostsProcessor, and the TypeScript type definition for this object is as follows:

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

The meanings of each field are as follows:

- `markdownDirectory: string` (required): Can be a relative or absolute path. If a relative path is provided, it will be resolved relative to `process.cwd()`, representing the directory where your markdown files are located.
- `jsonDirectory: string` (required): Same resolution rules as `markdownDirectory`. Represents the directory where the json files output by `oaks-post` are stored.
- `baseUrl?: string` (optional, default: ""): Acts as the URL prefix for each post in `posts.json`.
- `descending?: boolean` (optional, default: false): Determines the sorting order of the posts array in `posts.json`.
- `excerptOptions?: object` (optional):
  - `rule: PostsExcerptRule` (required, enum): Specifies the excerpt rule. Available options:
    - `PostsExcerptRule.ByLines` (default): Extracts markdown content by lines.
    - `PostsExcerptRule.`: Custom tag-based excerpt rule.
  - `lines?: number` (optional): Specifies the number of lines to extract, ignoring empty lines and treating code blocks as single lines.
  - `tag?: string` (optional, default: `<!--more-->`): Specifies the tag to extract content up to. Defaults to `<!--more-->`, a common excerpt delimiter used in `hexo`.
- `maxItems?: number` (optional) Specifying this value will enable pagination. When set to a value less than 0, the default value of 10 will be used.
