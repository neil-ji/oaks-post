# Introduce

A pure ES module runs on Node.js and focus on blog posts batched processing.

If you are building a static blog website with only HTML, CSS, and JS, then oaks-post can be very useful. It provides a persistent solution for blog articles by extracting information from Markdown files and generating JSON files.

In contrast to traditional static website generation methods, which directly generate multiple HTML, CSS, and JS resources, oaks-post focuses on generating JSON. This allows you to concentrate on the technical choices and style design of your personal blog app. You can freely use React, Vue, or any other application development solution that can run on Node.js. All you need to do is integrate oaks-post into your project by following the instructions below.

文档列表 / Documents list：

- [中文](/README.md)
- [English](/README_EN.md)

# Features

- Analyzing the Front Matter and content of markdown files and extract them into json;
- Fully supporting for Typescript types declaration;
- When batch processing multiple times, it will automatically skip articles that have already been processed.

# Install

```bash
npm install oaks-post
```

# Usage

Executing as bellow:

```js
import { MarkdownProcessor } from "oaks-post";
import { join } from "path";

const base = process.cwd();

const input = join(base, "your markdown directory");
const output = join(base, "your json directory");

const markdownProcessor = new MarkdownProcessor();
markdownProcessor.processFiles(input, output);
```

For example, such markdown file as bellow:

```markdown
---
title: Modified Test File
contentHash: da3ab45e
---

Modified test content
```

It will generate `.json` file like this:

```json
{
  "frontMatter": {
    "title": "Hello world",
    "contentHash": "da3ab45e"
  },
  "content": "hello world"
}
```
