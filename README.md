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
  - 排序：对 posts 进行基于时间或自然语言的排序；
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
import { PostsManager, sortDateAscend } from "oaks-post";

const yourMarkdownDirectory = "markdown";
const yourJsonDirectory = "json";

const posts = new PostsManager({
  baseUrl: "https://neil-ji.github.io/",
  inputDir: yourMarkdownDirectory,
  outputDir: yourJsonDirectory,
  itemsPerPage: 3,
  sort: sortDateAscend(),
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

# 参数定义

你可以传入一个对象以控制 PostsManager 的行为，具体如下：

- `inputDir: string`必填，可传入相对或绝对路径，解析相对路径将默认以`process.cwd()`为参照物，它代表你的 markdown 文件所在目录；
- `outputDir: string`：必填，解析规则同`inputDir`，它代表`oaks-post`输出的 json 文件的存放目录；
- `baseUrl?: string`：可选，默认为空字符串`""`，它将作为 posts.json 中各 post 的 url 前缀；
- `sort?: (a: PostItem, b: PostItem) => number`：可选，它决定了`posts.json`中 posts 数组的排列顺序，具体用法见[排序](#排序)；
- `excerpt?: object`可选，用于截取摘要,具体用法见[博客摘要](#博客摘要)：
  - `rule: PostsExcerptRule`：必填，枚举类型，可选值如下：
    - `PostsExcerptRule.ByLines`：按行数截取。
    - `PostsExcerptRule.CustomTag`：按自定义标记截取。
  - `lines?: number`：可选，指定所截取内容的行数，空行不计，代码块视作一行。
  - `tag?: string`：可选，截取到指定标记，默认为`<!--more-->`.
- `itemsPerPage?: number`：可选，指定该值将开启分页功能，默认不启用，具体用法见[博客分页](#博客分页)；

# 博客详情

每个 Markdown 文件都会生成对应的博客详情文件，命名格式为`post_[hash]_[basename].json`。

1. hash：8 位 16 进制数表示的 hash 值，由 Markdown 文件名+文件内容生成，使用非加密哈希函数 MurmurHash3，执行速度较快；
2. basename：Markdown 文件名；

博客详情属性定义如下：

1. frontMatter：解析 Front Matter 后生成的键值对，一般用于定义博客元数据，是以`---`标识的 YAML 语法块；
2. content：Markdown 正文；

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

# 博客摘要

通过`excerptOptions`灵活控制博客摘要的截取规则，具体如下。

## 按行数截取摘要

按行数截取是默认行为，Markdown 多行代码块语法会被识别为 1 行，另外，空行不会计算在内。

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

# 排序

你可以通过`sort`定义`posts.json`以及`posts_[page].json`中的文章排列顺序，`oaks-post`内置了常用的几种排序，你可以参照以下例子去使用：

```ts
import { sortDateAscend } from "oaks-post";

const posts = new PostsManager({
  // ...others
  sort: sortDateAscend(),
});
```

内置排序函数：

1. `sortDateAscend`：按时间升序排列；
2. `sortDateDescend`：按时间降序排列；
3. `sortLexOrderAscend`：按自然语言升序排列；
4. `sortLexOrderDescend`：按自然语言降序排列；

上述内置排序函数的签名是类似的，它们的参数如下：

1. `propName?: string`：用于指定 Front Matter 中的排序字段。对于时间排序，默认值为`date`；对于字符串排序，默认值为`title`；
2. `format?: (propValue: any) => any`：用于格式化 propName 对应的 value，其返回值会代替 propValue 参与排序；

## 按时间排序

举例 1：指定`created`字段以时间升序排列。

```ts
import { sortDateAscend } from "oaks-post";

const posts = new PostsManager({
  // ...others
  sort: sortDateAscend("created"),
});
```

举例 2：对于非 ISO 标准的时间字符串格式，可以通过`format`将其标准化为 Javascript Date 类型。

```ts
import { sortDateAscend } from "oaks-post";

const posts = new PostsManager({
  // ...others
  sort: sortDateAscend("created", (value) => {
    const result = value.match(/^([0-9]{4})_([0-9]{2})_([0-9]{2})$/);

    if (!result) {
      console.error("Failed match date string.");
      return new Date();
    }

    return new Date(result[1], result[2], result[3]);
  }),
});
```

上述例子中，通过正则表达式捕获形如`YYYY_MM_DD`的非标准时间格式的年、月、日，并传入 Date 构造函数。

如果你对正则表达式并不熟悉，那么推荐你使用流行的时间处理库完成这一步，如：`moment.js, day.js, date-fns, .etc`.

## 按自然语言排序

首先声明，自然语言排序不同于字符编码排序，具体表现在：

1. 字符编码排序是基于字符的二进制表示进行排序的。例如，在 ASCII 编码中，字符 A 的编码是 65，而字符 B 的编码是 66，所以在字符编码排序中，A 会排在 B 前面。
2. 自然语言排序则更接近人类的排序习惯。例如，自然语言排序会将字符串"2"排在"11"前面，因为 2 小于 11。但在字符编码排序中，"11"会排在"2"前面，因为字符 1 的编码小于字符 2。

你可以借助内置函数`sortLexOrderAscend/sortLexOrderDescend`来实现自然语言排序，它的参数同`sortDateAscend`类似，唯一的区别就是：format 必须返回字符串。

举例：指定`headline`字段以自然语言升序排列。

```ts
import { sortLexOrderAscend } from "oaks-post";

const posts = new PostsManager({
  // ...others
  sort: sortLexOrderAscend("headline"),
});
```

## 自定义排序

对于特殊场景，你可以自定义自己的排序函数 sort，其函数签名为`sort?: (a: PostItem, b: PostItem) => number;`.

如果你熟悉 Javascript 的话，那么你应该不会对该函数签名感到陌生，因为它就是`Array.prototype.sort`的参数签名，`posts`就是通过该原型方法实现的原地排序。

请参阅：[Array.prototype.sort()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)
