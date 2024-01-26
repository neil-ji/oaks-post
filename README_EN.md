# Introduce

A pure ES module runs on Node.js and focus on blog posts batched processing.

- [中文](/README.md)
- [English](/README_EN.md)

# Features

- Analyzing the Front Matter and content of markdown files and extract them into json;
- Inserting hash of content into Front Matter;
- Fully supporting for Typescript types declaration;

# Install

```bash
npm install oaks-post
```

# Usage

```js
import { MarkdownProcessorManager } from "oaks-post";
import { join } from "path";

const base = process.cwd();

const input = join(base, "your markdown directory");
const output = join(base, "your json directory");

const manager = new MarkdownProcessorManager();
manager.processFiles(input, output);
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
    "title": "Modified Test File",
    "contentHash": "da3ab45e"
  },
  "content": "Modified test content"
}
```
