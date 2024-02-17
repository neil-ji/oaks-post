# Introduction

This is a pure ES module (i.e., .mjs) that focuses on **Markdown file batch processing** in the context of **static blogs**. It only supports Nodejs and stores Markdown data in JSON files in a specific format. For the blog scenario, it provides indexing and pagination functions.

Document list:

- [Chinese](/README.md)
- [English](/README_EN.md)

# Features

Implemented:

- Data query:
  - Blog details: Batch parse markdown files (support Front Matter parsing), generate `post_[hash]_[basename].json`;
  - Blog index: Generate `posts.json`, which contains basic information of all blog articles;
  - Blog abstract: Long content will be cut into abstracts by line number or specified special marks (such as `<!--more-->`);
  - Pagination: Split the data in `posts.json` into several JSON files, generate `posts_[page].json`;
- Performance optimization:
  - Skip files that have been processed;
  - On-demand loading can be achieved with the help of pagination function;
  - Stream reading and writing, improve the efficiency of long blog processing;
- Type check: Complete Typescript type definition, good code hint;

TODO List:

- JSON file compression/decompression;
- Support Tag/Category function;

# Installation

```bash
npm install oaks-post
```

# Usage

The invocation is as follows:

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

For example, the `markdown/Hello Oaks.md` file is as follows:

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

The generated blog details `json\post_a46fd04a_Hello Oaks.json` file is as follows:

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

The generated blog index file `json_database/posts.json`:

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

The generated pagination file `json_database/posts_1.json`:

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

# Parameter definition

You can pass in an object to control the behavior of PostsManager, as follows:

- `inputDir: string` is required, and you can pass in a relative or absolute path. The relative path will be parsed with `process.cwd()` as the reference by default, which represents the directory where your markdown file is located;
- `outputDir: string`: required, the parsing rules are the same as `inputDir`, it represents the storage directory of the json file output by `oaks-post`;
- `baseUrl?: string`: optional, the default is the empty string `""`, which will be used as the url prefix of each post in posts.json;
- `sort?: (a: PostItem, b: PostItem) => number`: Optional, it determines the order of the posts array in `posts.json`. For specific usage, see [Sort](#sort);
- `excerpt?: object` is optional and is used to intercept the summary. For specific usage, see [Blog Summary](#blog-summary):
  - `rule: PostsExcerptRule`: required, enumeration type, optional values are as follows:
    - `PostsExcerptRule.ByLines`: intercept by line number.
    - `PostsExcerptRule.CustomTag`: intercept according to custom tag.
  - `lines?: number`: Optional, specifies the number of lines of intercepted content. Blank lines are not counted, and the code block is regarded as one line.
  - `tag?: string`: Optional, intercept the specified tag, the default is `<!--more-->`.
- `itemsPerPage?: number`: Optional. Specifying this value will enable the paging function. It is not enabled by default. For specific usage, see [Blog Pagination] (#blog pagination);

# Blog details

Each Markdown file will generate a corresponding blog details file with the naming format `post_[hash]_[basename].json`.

1. Hash: A hash value represented by an 8-digit hexadecimal number, generated from the Markdown file name + file content, using the non-encrypted hash function MurmurHash3, which has faster execution speed;
2. basename: Markdown file name;

The blog details attribute is defined as follows:

1. frontMatter: A key-value pair generated after parsing Front Matter. It is generally used to define blog metadata. It is a YAML syntax block marked with `---`;
2. content: Markdown text;

# Blog index

This file is used to obtain the full amount of blog data. Specifically, `oaks-post` will collect all Markdown-processed JSON data and store it uniformly in the `posts.json` file, which is similar to the table in the database. The function is to provide an index of all blog details.

The properties are defined as follows:

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

# Blog Summary

Flexibly control the interception rules of blog abstracts through `excerptOptions`, as detailed below.

## Extract summary by number of lines

Truncating by line number is the default behavior. Markdown multi-line code block syntax will be recognized as 1 line. In addition, blank lines will not be counted.

An example of intercepting the first 5 lines is as follows:

```ts
const posts = new PostsManager({
  // ...others
  excerptOptions: {
    rule: PostsExcerptRule.ByLines,
    lines: 5,
  },
});
```

## Intercept summary according to specified mark

Supports content interception based on custom tags in Markdown files. After selecting this rule, you do not need to provide a tag. In this case, the interception tag defaults to `<!--more-->`, which is a popular writing method of hexo.

Of course, you can also provide any custom tag of your own. It is recommended to use Markdown comment syntax to define tags.

```ts
const posts = new PostsManager({
  // ...others
  excerptOptions: {
    rule: PostsExcerptRule.CustomTag,
    tag: "<!--YOUR_TAG-->",
  },
});
```

Tags are used in Markdown files as follows:

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

Generated JSON data:

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

# Blog pagination

When you need to paginate or scroll to load data, enable the paging function through `maxItems`. The default is **no paging**. When illegal data is passed in, the default value 10 will be used.

The naming format of the paging file is `posts_[page].json`, page represents the page number, and the attributes are defined as follows:

```ts
interface PostsPage {
  current: number;
  posts: PostItem[];
  prev?: string;
  next?: string;
}
```

# Sort

You can define the order of articles in `posts.json` and `posts_[page].json` through `sort`. `oaks-post` has several commonly used sorting built-in. You can refer to the following examples to use:

```ts
import { sortDateAscend } from "oaks-post";

const posts = new PostsManager({
  // ...others
  sort: sortDateAscend(),
});
```

Built-in sorting functions:

1. `sortDateAscend`: sort in ascending order by time;
2. `sortDateDescend`: sort by time in descending order;
3. `sortLexOrderAscend`: sort in ascending order of natural language;
4. `sortLexOrderDescend`: sort in descending order of natural language;

The signatures of the above built-in sorting functions are similar, and their parameters are as follows:

1. `propName?: string`: used to specify the sorting field in Front Matter. For time sorting, the default value is `date`; for string sorting, the default value is `title`;
2. `format?: (propValue: any) => any`: used to format the value corresponding to propName, and its return value will replace propValue in sorting;

## Sort by time

Example 1: Specify the `created` field to be sorted in ascending order of time.

```ts
import { sortDateAscend } from "oaks-post";

const posts = new PostsManager({
  // ...others
  sort: sortDateAscend("created"),
});
```

Example 2: For non-ISO standard time string format, it can be standardized to Javascript Date type through `format`.

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

In the above example, the year, month, and day in a non-standard time format such as `YYYY_MM_DD` are captured through regular expressions and passed into the Date constructor.

If you are not familiar with regular expressions, it is recommended that you use popular time processing libraries to complete this step, such as: `moment.js, day.js, date-fns, .etc`.

## Sort by natural language

First of all, it is stated that natural language sorting is different from character encoding sorting, specifically as follows:

1. Character encoding sorting is based on the binary representation of characters. For example, in ASCII encoding, the encoding of character A is 65, and the encoding of character B is 66, so in the character encoding sorting, A will be ranked before B.
2. Natural language sorting is closer to human sorting habits. For example, natural language sorting would rank the string "2" before "11" because 2 is less than 11. But in the character encoding sorting, "11" will be ranked before "2" because the encoding of character 1 is smaller than that of character 2.

You can use the built-in function `sortLexOrderAscend/sortLexOrderDescend` to implement natural language sorting. Its parameters are similar to `sortDateAscend`. The only difference is that format must return a string.

Example: Specify the `headline` field to be sorted in ascending order of natural language.

```ts
import { sortLexOrderAscend } from "oaks-post";

const posts = new PostsManager({
  // ...others
  sort: sortLexOrderAscend("headline"),
});
```

## Custom sorting

For special scenarios, you can customize your own sorting function sort, whose function signature is `sort?: (a: PostItem, b: PostItem) => number;`.

If you are familiar with Javascript, then you should not be unfamiliar with this function signature, because it is the parameter signature of `Array.prototype.sort`, and `posts` is the in-place sorting implemented through this prototype method.

See [Array.prototype.sort()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)
