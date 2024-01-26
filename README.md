# 简介

这是一个专注于博客文章（.md 文件）批处理的纯 ES 模块（也就是.mjs）

如果你只是搭建一个静态的博客网站（只有 html、css、js），那么`oaks-post`会非常有用，它提供了一种针对博客文章的持久化方案——提取 markdown 文件信息并生成 json 文件。

相比于传统静态网站生成方案——直接生成若干 html、css、js 资源，`oaks-post`专注于生成 json，这就使得你可以专注于个人博客 App 的技术选型与风格设计，可以自由使用 react、vue 或其他任何可以在 Node.js 上运行的应用开发方案，你只需要引入`oaks-post`，并按照下文指引将其集成到自己的项目中即可.

文档列表 / Documents list：

- [中文](/README.md)
- [English](/README_EN.md)

# 功能

- 解析 Markdown 文件的 Front Matter 和内容两部分，然后把它们提取到一个 json 文件中；
- 完整的 Typescript 类型定义，良好的代码提示；
- 多次批处理时，会自动跳过已处理过的文章；

# 安装

```bash
npm install oaks-post
```

# 使用

调用如下：

```js
import { MarkdownProcessor } from "oaks-post";
import { join } from "path";

const base = process.cwd();

const input = join(base, "your markdown directory");
const output = join(base, "your json directory");

const markdownProcessor = new MarkdownProcessor();
markdownProcessor.processFiles(input, output);
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