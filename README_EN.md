# Introduce

A pure ES module runs on Node.js and focus on blog posts batched processing.

- [中文](/README.md)
- [English](/README_EN.md)

# Features

- analyze Front Matter and content of markdown files and extract them into json;
- insert hash of content into Front Matter;

# Install

```bash
npm install oaks-post
```

# Usage

```js
import { processMarkdownFiles } from "oaks-post";
import { join } from "path";

const prefix = process.cwd();

const input = join(prefix, "your markdown directory");
const output = join(prefix, "your json directory");

processMarkdownFiles(input, output);
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
