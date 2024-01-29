# Introduce

A pure ES module runs on Node.js and focus on blog posts batched processing.

If you are building a static blog website with only HTML, CSS, and JS, then `oaks-post` can be very useful. It provides a persistent solution for blog posts by extracting information from Markdown files and generating JSON files.

In contrast to traditional static website generation methods, which directly generate multiple HTML, CSS, and JS resources, `oaks-post` focuses on generating JSON. This allows you to concentrate on the technical choices and style design of your personal blog app. You can freely use React, Vue, or any other application development solution that can run on Node.js. All you need to do is integrate `oaks-post` into your project by following the instructions below.

文档列表 / Documents list：

- [中文](/README.md)
- [English](/README_EN.md)

# Features

- Parse both the Front Matter and content parts of Markdown files, calculate their HASH values, and then extract them into `post_[hash].json` (for example, `post_c1ae890.json`).
- After the initial execution, subsequent generations of `post_[hash].json` will compare HASH values and skip posts that have already been processed.
- Automatically generate a `posts.json` similar to a database table, which can be used for traversing posts.
- Automatically generate URLs for the JSON files, also stored in `posts.json`.
- Comprehensive TypeScript type definitions for improved code hints.

# Install

```bash
npm install oaks-post
```

# Usage

Executing as bellow:

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

For example, such markdown file as bellow:

```markdown
---
title: Hello world
---

hello world
```

It will generate `.json` file like this:

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
      "excerpt": "hello world"
    }
  ]
}
```

# Configuration Parameters

You can pass an object to control some behaviors of the PostsProcessor, and the TypeScript type definition for this object is as follows:

```ts
interface PostsProcessorOptions {
  baseUrl?: string;
  markdownDirectory: string;
  jsonDirectory: string;
  descending?: boolean;
  excerptOptions?: PostsExcerptOptions;
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
