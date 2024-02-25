# Introduction

Documents / Documents

- [Chinese](/README.md)
- [English](/README_EN.md)

Note that `oaks-post` only works in Nodejs environment.

What is `oaks-post`?

1. Lightweight, high-performance Markdown to JSON library;
2. Provide common functions of static blog websites: list, paging, sorting, archiving, tags, classification, etc.;
3. Applicable to Nodejs (note, not compatible with versions before v14.0.0)

What does `oaks-post` solve?

For self-built static blog websites, `oaks-post` aims to provide a cross-platform Markdown data parsing and storage solution.

![OaksPostWorkflow.drawio.png](https://img2.imgtp.com/2024/02/24/rle4btsr.png)

With the help of `oaks-post`, you don’t need to pay attention to Markdown parsing, list paging, article classification and other logic. You can choose any UI framework to build your own blog App.

As long as you follow the data format agreed by `oaks-post`, the business logic can be simplified into simple data display.

# Function

Already implemented:

- Markdown to JSON:
  - Article details: Parse markdown files in batches and generate `post_[hash]_[basename].json`;
  - Article list: Generate `posts.json`, which contains basic information of all blog articles;
  - Article classification:
    - Tag: more flexible and does not reflect hierarchical relationships;
    - Category: more rigorous and hierarchical, similar to directories in a file system;
  - Article summary: Long content will be summarized by the number of lines or specified special tags (such as `<!--more-->`);
  - Pagination: Split the data in `posts.json` into several JSON files to generate `posts_[page].json`;
  - Sorting: Sort posts based on time or natural language;
  - Front Matter: Support parsing Front Matter metadata;
- Performance optimization:
  - Skip already processed files;
  - On-demand loading can be achieved with the help of paging function;
  - Streaming reading and writing improves the efficiency of large file processing;
  - Parallel priority, asynchronous processing flow is reasonable and efficient;
- Type checking: complete Typescript type definitions, good code tips;

TODO List:

- JSON compression/decompression
- Archive
- Article statistics
- Generate RSS XML
- Command line script
- Automatically generate Category based on Markdown directory structure
- Log printing beautification

Note that the above order is not the order of updates. If you have new requirements or find bugs, you are welcome to create issues to discuss together (in both Chinese and English).

# Install

First, make sure that the Nodejs version number is higher than v14.0, otherwise compatibility issues may occur.

```bash
node -v
```

Then enter the specified project directory and execute the following instructions to install `oaks-post`

```bash
npm install oaks-post
```

# use

The call is as follows:

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

Before deciding to use `oaks-post`, you can create a Devbox for free through [codesandbox.io](https://codesandbox.io/), select the Nodejs template, and then configure the following to run everything in the browser Sample code:

1. Log in to [codesandbox.io](https://codesandbox.io/) and create Devbox;
2. Select the Nodejs template and leave other options as default;
3. Install `oaks-post`;
4. Create the directory `markdown`, and create several markdown files in this directory, such as `hello.md`;
5. Write sample code in `index.js`;
6. Enter `npm start` in the console, or click the restart button in the console where start has been executed;

Note that since it is an online environment, the IO operation will take a while to see the results (please refresh if there are no results). This is determined by the delay from the server to the browser and is not a performance issue.

#Configuration

You can pass in an object to control the behavior of PostsManager, as follows:

- `inputDir: string`: required, you can pass in a relative or absolute path. The relative path will be parsed with `process.cwd()` as the reference by default, which represents the directory where your markdown file is located;
- `outputDir: string`: required, the parsing rules are the same as `inputDir`, it represents the storage directory of the json file output by `oaks-post`;
- `baseUrl?: string`: optional, the default is the empty string `""`, which will be used as the url prefix of each post in posts.json;
- `collection?: object`: optional, controls the parsing and generation of `posts.json`;
  - `outputDir?: string`: optional, controls the output directory of `posts.json`, the default is `${outputDir}_posts`;
  - `sort?: (a: PostItem, b: PostItem) => number`: Optional, it determines the order of the posts array in `posts.json`. For specific usage, see [Sort](#sort);
  - `excerpt?: object` is optional and is used to intercept the summary. For specific usage, see [Blog Summary](#Blog Summary):
    - `rule: PostsExcerptRule`: required, enumeration type, optional values are as follows:
      - `PostsExcerptRule.ByLines`: intercept by line number.
      - `PostsExcerptRule.CustomTag`: intercept according to custom tag.
      - `PostsExcerptRule.NoContent`: Forces to return an empty string;
      - `PostsExcerptRule.FullContent`: without splitting, return Markdown content directly;
    - `lines?: number`: Optional, specifies the number of lines of intercepted content. Blank lines are not counted, and the code block is regarded as one line.
    - `tag?: string`: Optional, intercept the specified tag, the default is `<!--more-->`.
  - `itemsPerPage?: number`: optional. Specifying this value will enable the paging function. It is not enabled by default. For detailed usage, see [Paging](#Paging);
- `tag?: object`: optional, controls the parsing and generation of `tags.json`;
  - `outputDir, sort, excerpt, itemsPerPage` Same as above;
  - `propName?: string`: Specifies the property name used to record Tag information in Front Matter, the default is `tag`;
- `category?: object`: optional, controls the parsing and generation of `categories.json`;
  - `outputDir, sort, excerpt, itemsPerPage` Same as above;
  - `propName?: string`: Specifies the property name used to record Category information in Front Matter, the default is `category`;
  - `rule?: PostsCategoriesAnalyzeRule`: optional, enumeration type, optional values are as follows:
    - `PostsCategoriesAnalyzeRule.FrontMatter`: Default value, parses Category information from Front Matter;
    - `PostsCategoriesAnalyzeRule.Disable`: Ignore Category configuration, do not parse Category, and will not generate any files;

# Blog details

Each Markdown file will generate a corresponding blog details file with the naming format `post_[hash]_[basename].json`.

1. Hash: A hash value represented by an 8-digit hexadecimal number, generated from the Markdown file name + file content, using the non-encrypted hash function MurmurHash3, which has faster execution speed;
2. basename: Markdown file name;

The blog details attribute is defined as follows:

```ts
interface Post {
  /** Markdown front matter */
  frontMatter: PostFrontMatter;

  /** Markdown content */
  content: string;
}
```

The remaining related types are defined as follows:

```ts
interface PostFrontMatter {
  [key: string]: any;
}
```

# Article list

This file is used to obtain the full article list. `oaks-post` will collect all Markdown-processed JSON data and write it into `posts.json`. The attributes are defined as follows:

```ts
interface Posts {
  /** Partial or all posts */
  posts: PostsItem[];

  /** URLs of posts pages */
  postsPages?: string[];
}
```

The remaining related types are defined as follows:

```ts
interface PostsItem extends ExcerptedPost {
  /** Unique identifier of a post */
  hash?: string;

  /** URL of a post */
  url?: string;
}

interface ExcerptedPost {
  /** Markdown front matter */
  frontMatter?: PostFrontMatter;

  /** Excerpt from Markdown content */
  excerpt?: string;
}

interface PostFrontMatter {
  [key: string]: any;
}
```

# Blog classification

Category and Tag are commonly used Markdown article classification methods. Their specific differences are as follows:

1. Category is a relatively static classification method that is usually used to broadly group website articles. We can think of them as general themes or directories for a WordPress website. Categories have a hierarchical structure, which means we can create sub-categories. For example, libraries often use categories to organize books.

2. Tag is used to describe the specific details of the article. It is more flexible and not restricted by strict hierarchies. Tags can be keywords, topics, authors, geographical information, etc. Unlike categories, an article can have multiple tags or no tags. Tags are more naturally summarized from the properties of specific objects and do not need to be defined in advance.

## Category

Category related configuration is defined as follows:

```ts
interface PostsClassifierOptions extends PostsListBase {
  /** Control posts categories analyzing. */
  rule?: PostsCategoriesAnalyzeRule;

  /** Specify prop name in the markdown front matter to replace default prop `category`. */
  propName?: string;
}

interface PostsListBase {
  /** Sort posts array */
  sort?: (a: PostsItem, b: PostsItem) => number;

  /** Settings for post excerpt analysis */
  excerpt?: PostsExcerptOptions;

  /** Enable paginate and specify max items count of per page */
  itemsPerPage?: number;

  /** Specify output directory for posts and pages. Absolute or relative path are both worked */
  outputDir?: string;
}
```

If you identify the article category in Front Matter in the form of `category: [root, sub category]`, you do not need to pass in `propName`, otherwise you need to specify the key name of the category array through `propName`.

Note that category writing rules are fixed: the order of elements indicates the nesting level, for example, `category: [root, sub category 1, sub category 2]`, root is the root category, sub category 1 is the subcategory of root, and similarly, sub Category 2 is a subcategory of sub category 1, and so on.

After Category classification parsing is enabled, if the `manager.category.outputDir` attribute is not specified, the directory `${manager.outputDir}_categories` will be created by default and used as the output directory for related files.

See below for pagination, sorting, and summary.

Enabling the Category feature will generate a `categories.json` file, containing all categories and article information. The data format is defined as `PostCategoriesItem[]` as follows:

```ts
interface PostCategoriesItem extends Posts {
  /** Category name */
  category: string;

  /** Subcategories */
  subcategories: PostCategoriesItem[];
}

interface Posts {
  /** Partial or all posts */
  posts: PostsItem[];

  /** URLs of posts pages */
  postsPages?: string[];
}
```

Categories are stored in a tree structure. The following is a simple data traversal example:

```ts
import rawData from "./json_categories/categories.json";

const data: PostCategoriesItem[] = JSON.parse(rawData);

function access(data: PostCategoriesItem[]) {
  data.forEach(({ posts, postsPages, category, subcategories }) => {
    // access data as your wish
    console.log(posts);

    // access subcategories recursively
    access(subcategories);
  });
}

access(data);
```

## Tag

Tag related configuration is defined as follows:

```ts
interface PostsTaggerOptions extends PostsListBase {
  /** Specify prop name in the markdown front matter to replace default prop `tag`. */
  propName?: string;
}
interface PostsListBase {
  /** Sort posts array */
  sort?: (a: PostsItem, b: PostsItem) => number;

  /** Settings for post excerpt analysis */
  excerpt?: PostsExcerptOptions;

  /** Enable paginate and specify max items count of per page */
  itemsPerPage?: number;

  /** Specify output directory for posts and pages. Absolute or relative path are both worked */
  outputDir?: string;
}
```

If you identify the article category in the form of `tag: [js, es6, promise]` in Front Matter, there is no need to pass in `propName`, otherwise you need to specify the key name of the tag array through `propName`, and there is no need to consider writing tags Element order, all tags are horizontal.

After enabling Tag classification parsing, if the `manager.tag.outputDir` attribute is not specified, the directory `${manager.outputDir}_tags` will be created by default and used as the output directory for related files.

See below for pagination, sorting, and summary.

Enabling the Tag feature will generate a `tags.json` file, containing all tag and article information. The data format is defined as `PostTagsItem[]` as follows:

```ts
interface PostTagsItem extends Posts {
  /** Tag name */
  tag: string;
}

interface Posts {
  /** Partial or all posts */
  posts: PostsItem[];

  /** URLs of posts pages */
  postsPages?: string[];
}
```

#Blog Summary

Flexibly control the interception rules of blog abstracts through `excerptOptions`, as detailed below.

## Extract summary by number of lines

Truncating by line number is the default behavior. Markdown multi-line code block syntax will be recognized as 1 line. In addition, blank lines will not be counted.

An example of intercepting the first 5 lines is as follows:

```ts
const posts = new PostsManager({
  // ...others
  collection: {
    excerpt: {
      rule: PostsExcerptRule.ByLines,
      lines: 5,
    },
  },
});
```

## Intercept summary according to specified mark

Supports content interception based on custom tags in Markdown files. After selecting this rule, you do not need to provide a tag. In this case, the interception tag defaults to `<!--more-->`, which is a popular writing method of hexo.

Of course, you can also provide any custom tag of your own. It is recommended to use Markdown comment syntax to define tags.

```ts
const posts = new PostsManager({
  // ...others
  collection: {
    excerpt: {
      rule: PostsExcerptRule.CustomTag,
      tag: "<!--YOUR_TAG-->",
    },
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
  "posts": [
    {
      // ...others
      "excerpt": "Hello\nHello\n\n"
    }
  ]
}
```

# Pagination

When you need to paginate or scroll to load data, enable the paging function through `itemsPerPage`. The default is **no paging**. When illegal data is passed in, the default value 10 will be used.

When paging is enabled, the `pages` directory will be created in the output directory of the corresponding list, and the paging file naming format is `posts[segment]_[page].json`:

- segment: the Tag or Category name to which the list belongs;
- page: represents the page number, and the attributes are defined as follows:

The data format is as follows:

```ts
interface PostsPage {
  /** Aggregate of posts pages */
  pages: number;

  /** Current page index */
  current: number;

  /** Posts list of each page */
  posts: PostsItem[];

  /** URL of current page */
  url: string;

  /** URL of previous page */
  prev?: string;

  /** URL of next page */
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

See: [Array.prototype.sort()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)
