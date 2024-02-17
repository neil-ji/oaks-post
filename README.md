# 简介

这是一个专注于**静态博客**场景下 **Markdown 文件批处理**的纯 ES 模块（也就是.mjs），仅支持 Nodejs，批量地将 Markdown 数据以特定格式存储在 JSON 文件中，针对博客场景，提供索引、分页功能。

文档列表 / Documents list：

- [中文](/README.md)
- [English](/README_EN.md)

# 功能

已实现：

- 数据查询：
  - 博客详情：批量解析 markdown 文件（支持 Front Matter 解析），生成`post_[hash]_[basename].json`；
  - 博客索引：生成`posts.json`，包含所有博客文章的基本信息；
  - 博客摘要：长内容会按行数或指定的特殊标记（如`<!--more-->`）截取出摘要；
  - 分页：将`posts.json`中的数据分割到若干 JSON 文件中，生成`posts_[page].json`；
- 性能优化：
  - 跳过已处理过的文件；
  - 借助分页功能可以实现按需加载；
  - 流式读写，提高长博客处理效率；
- 类型检查：完整的 Typescript 类型定义，良好的代码提示；

TODO List：

- JSON 文件压缩/解压缩；
- 支持 Tag/Category 功能；

# 安装

```bash
npm install oaks-post
```

# 使用

调用如下：

```js
import { PostsManager } from "oaks-post";

const yourMarkdownDirectory = "markdown";
const yourJsonDirectory = "json";

const posts = new PostsManager({
  baseUrl: "https://neil-ji.github.io/",
  inputDir: yourMarkdownDirectory,
  outputDir: yourJsonDirectory,
  descending: true,
  maxItems: 3,
});

posts.start();
```

举例，`markdown/Hello Oaks.md` 文件如下：

```markdown
---
title: Hello Oaks
date: 2023-07-25 14:40:00
tag:
  - introduce
  - oaks-post
---

# Oaks Introduction

This is a pure ES module focused on 'Markdown file batch processing' in the static blog scenario.

This is a pure ES module focused on 'Markdown file batch processing' in the static blog scenario.

This is a pure ES module focused on 'Markdown file batch processing' in the static blog scenario.

This is a pure ES module focused on 'Markdown file batch processing' in the static blog scenario.

This is a pure ES module focused on 'Markdown file batch processing' in the static blog scenario.
```

生成博客详情 `json\post_a46fd04a_Hello Oaks.json` 文件如下：

```json
{
  "frontMatter": {
    "title": "Hello Oaks",
    "date": "2023-07-25T14:40:00.000Z",
    "tag": ["introduce", "oaks-post"]
  },
  "content": "\r\n## Oaks Introduction\r\n\r\nThis is a pure ES module focused on 'Markdown file batch processing' in the static blog scenario.\r\n\r\nThis is a pure ES module focused on 'Markdown file batch processing' in the static blog scenario.\r\n\r\nThis is a pure ES module focused on 'Markdown file batch processing' in the static blog scenario.\r\n\r\nThis is a pure ES module focused on 'Markdown file batch processing' in the static blog scenario.\r\n\r\nThis is a pure ES module focused on 'Markdown file batch processing' in the static blog scenario."
}
```

生成博客索引文件`json_database/posts.json`：

```json
{
  "buildTime": "2024-02-17T06:14:11.288Z",
  "posts": [
    {
      "url": "https:/neil-ji.github.io/json/post_a46fd04a_Hello Oaks.json",
      "hash": "a46fd04a",
      "frontMatter": {
        "title": "Hello Oaks",
        "date": "2023-07-25T14:40:00.000Z",
        "tag": ["introduce", "oaks-post"]
      },
      "excerpt": "## Oaks Introduction\r\n\nThis is a pure ES module focused on 'Markdown file batch processing' in the static blog scenario.\r\n\nThis is a pure ES module focused on 'Markdown file batch processing' in the static blog scenario.\r\n\nThis is a pure ES module focused on 'Markdown file batch processing' in the static blog scenario.\r\n\nThis is a pure ES module focused on 'Markdown file batch processing' in the static blog scenario."
    }
  ]
}
```

生成分页文件`json_database/posts_1.json`：

```json
{
  "current": 1,
  "posts": [
    {
      "url": "https:/neil-ji.github.io/json/post_a46fd04a_Hello Oaks.json",
      "hash": "a46fd04a",
      "frontMatter": {
        "title": "Hello Oaks",
        "date": "2023-07-25T14:40:00.000Z",
        "tag": ["introduce", "oaks-post"]
      },
      "excerpt": "## Oaks Introduction\r\n\nThis is a pure ES module focused on 'Markdown file batch processing' in the static blog scenario.\r\n\nThis is a pure ES module focused on 'Markdown file batch processing' in the static blog scenario.\r\n\nThis is a pure ES module focused on 'Markdown file batch processing' in the static blog scenario.\r\n\nThis is a pure ES module focused on 'Markdown file batch processing' in the static blog scenario."
    }
  ]
}
```

# 博客详情

每个 Markdown 文件都会生成对应的博客详情文件，命名格式为`post_[hash]_[basename].json`。

1. hash：8 位 16 进制数表示的 hash 值，由 Markdown 文件名+文件内容生成，使用非加密哈希函数 MurmurHash3，执行速度较快；
2. basename：Markdown 文件名；

博客详情属性定义如下：

1. frontMatter：解析 Front Matter 后生成的键值对，一般用于定义博客元数据，是以`---`标识的 YAML 语法块；
2. content：Markdown 正文；

# 博客摘要

通过`excerptOptions`灵活控制博客摘要的截取规则，具体如下。

## 按行数截取摘要

按行数截取是默认行为，且 Markdown 多行代码块语法会被识别为 1 行。

截取前 5 行示例如下：

```ts
const posts = new PostsManager({
  // ...others
  excerptOptions: {
    rule: PostsExcerptRule.ByLines,
    lines: 5,
  },
});
```

## 按指定标记截取摘要

支持按照 Markdown 文件内的自定义标记进行内容截取，选择该规则后可以不提供 tag，此时截取标记默认为`<!--more-->`，这是 hexo 的流行写法。

当然你也可以提供任意你自己自定义的 tag，推荐使用 Markdown 注释语法来定义 tag.

```ts
const posts = new PostsManager({
  // ...others
  excerptOptions: {
    rule: PostsExcerptRule.CustomTag,
    tag: "<!--YOUR_TAG-->",
  },
});
```

Markdown 文件中使用 tag 如下：

```markdown
Hello
Hello

<!--YOUR_TAG-->

Hello
Hello
Hello
Hello
Hello
Hello
```

所生成的 JSON 数据：

```json
{
  "buildTime": "2024-02-17T06:14:11.288Z",
  "posts": [
    {
      // ...others
      "excerpt": "Hello\nHello\n\n"
    }
  ]
}
```

# 博客索引

该文件用于获取全量博客数据的场景，具体来说，`oaks-post`会收集所有 Markdown 处理后的 JSON 数据，将其统一存放在`posts.json`文件中，该文件类似于数据库中表的作用，提供对所有博客详情的索引。

属性定义如下：

```ts
interface Posts {
  buildTime: Date;
  posts: PostItem[];
}
interface PostItem {
  hash?: string;
  url?: string;
  frontMatter?: PostFrontMatter;
  excerpt?: string;
}
interface PostFrontMatter {
  [key: string]: any;
}
```

# 博客分页

当你需要分页或滚动加载数据时，通过`maxItems`启用分页功能，默认**不分页**，传入非法数据时会使用默认值 10.

分页文件命名格式为`posts_[page].json`，page 代表页码，属性定义如下：

```ts
interface PostsPage {
  current: number;
  posts: PostItem[];
  prev?: string;
  next?: string;
}
```

# 配置参数

你可以传入一个对象以控制 PostsManager 的部分行为，该对象的 TS 类型定义如下：

```ts
interface PostsManagerOptions {
  baseUrl?: string;
  inputDir: string;
  outputDir: string;
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

- `inputDir: string`必填，可传入相对或绝对路径，解析相对路径将默认以`process.cwd()`为参照物，它代表你的 markdown 文件所在目录；
- `outputDir: string`：必填，解析规则同`inputDir`，它代表`oaks-post`输出的 json 文件的存放目录；
- `baseUrl?: string`：可选，默认为空字符串`""`，它将作为 posts.json 中各 post 的 url 前缀；
- `descending?: boolean`：可选，默认为`false`（按时间升序排列），它决定了`posts.json`中 posts 数组的排列顺序；
- `excerptOptions?: object`可选：
  - `rule: PostsExcerptRule`：必填，枚举类型，可选值如下：
    - `PostsExcerptRule.ByLines`：默认为按行截取 markdown 内容。
    - `PostsExcerptRule.CustomTag`：可选按自定义标记截取 markdown 内容。
  - `lines?: number`：可选，指定所截取内容的行数，空行不计，代码块视作一行。
  - `tag?: string`：可选，截取到指定标记，默认为`<!--more-->`，这是`hexo`通用的摘要截取标记。
- `maxItems?: number`：可选，指定该值将开启分页功能，默认不启用分页，小于 0 时将使用默认值 10；
