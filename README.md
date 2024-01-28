# 简介

这是一个专注于博客文章（.md 文件）批处理的纯 ES 模块（也就是.mjs）

如果你只是搭建一个静态的博客网站（只有 html、css、js），那么`oaks-post`会非常有用，它提供了一种针对博客文章的持久化方案——提取 markdown 文件信息并生成 json 文件。

相比于传统静态网站生成方案——直接生成若干 html、css、js 资源，`oaks-post`专注于生成 json，这就使得你可以专注于个人博客 App 的技术选型与风格设计，可以自由使用 react、vue 或其他任何可以在 Node.js 上运行的应用开发方案，你只需要引入`oaks-post`，并按照下文指引将其集成到自己的项目中即可.

文档列表 / Documents list：

- [中文](/README.md)
- [English](/README_EN.md)

# 功能

- 解析 Markdown 文件的 Front Matter 和内容两部分，计算 HASH 值，然后把它们提取到`post_[hash].json`中（比如`post_c1ae890.json`）；
- 第一次执行后，后续再次生成 `post_[hash].json` 前会比对 HASH 值，跳过已处理过的文章；
- 自动生成一个类似数据库表的`posts.json`，可用于对文章的遍历；
- 自动生成 json 文件的 URL，同样存储在`posts.json`中；
- 完整的 Typescript 类型定义，良好的代码提示；

# 安装

```bash
npm install oaks-post
```

# 使用

调用如下：

```js
import { PostsProcessor } from "oaks-post";
import { join } from "path";

const base = process.cwd();

const markdownDirectory = join(base, "your markdown directory");
const jsonDirectory = join(base, "your json directory");

const posts = new PostsProcessor({
  markdownDirectory,
  jsonDirectory,
});
posts.processFiles();
```

举例如下，markdown 文件像这样：

```markdown
---
title: Hello world
---

hello world
```

所生成的对应 JSON 文件如下：

```json
// post_44a474ca.json

{
  "frontMatter": {
    "title": "Hello world",
    "contentHash": "da3ab45e"
  },
  "content": "hello world"
}
```

```json
// posts.json

{
  "buildTime": "2024-01-27T09:15:01.981Z",
  "posts": [
    {
      "url": "your_baseUrl/your_json_directory/post_44a474ca.json",
      "hash": "44a474ca",
      "frontMatter": {
        "title": "Hello world"
      },
      "content": "hello world"
    }
  ]
}
```

# 配置参数

你可以传入一个对象以控制 PostsProcessor 的部分行为，该对象的 TS 类型定义如下：

```ts
interface PostsProcessorOptions {
  baseUrl?: string;
  markdownDirectory: string;
  jsonDirectory: string;
  descendByDate?: boolean;
}
```

以下为各字段含义：

- `markdownDirectory: string`: **Required**; Can be passed a relative or absolute path. Relative paths will be resolved by default relative to `process.cwd()`, representing the directory where your markdown files are located.
- `jsonDirectory: string`: **Required**; Resolution rules are the same as `markdownDirectory`. It represents the directory where the JSON files output by `oaks-post` will be stored.
- `baseUrl?: string`: **Optional**; Default is an empty string `""`. It will serve as the URL prefix for each post in the `posts.json`.
- `descendByDate?: boolean`: **Optional**; Default is `false`. It determines the order of the posts array in `posts.json`.
