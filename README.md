# 简介

这是一个专注于博客项目文章批处理的纯 ES 模块（也就是.mjs）

- [中文](/README.md)
- [English](/README_EN.md)

# 功能

- 解析 Markdown 文件的 Front Matter 和内容两部分，然后把它们提取到一个同名 json 文件中；
- 计算 Markdown 内容部分的 Hash 值，并写入 Front Matter；
- 完整的Typescript类型定义，良好的代码提示；

# 安装

```bash
npm install oaks-post
```

# 使用

调用如下：

```js
import { processMarkdownFiles } from "oaks-post";
import { join } from "path";

const prefix = process.cwd();

const input = join(prefix, "your markdown directory");
const output = join(prefix, "your json directory");

processMarkdownFiles(input, output);
```

举个例子，如下 markdown 文件：

```markdown
---
title: Hello world
contentHash: da3ab45e
---

hello world
```

所生成的对应 json 文件如下：

```json
{
  "frontMatter": {
    "title": "Hello world",
    "contentHash": "da3ab45e"
  },
  "content": "hello world"
}
```
