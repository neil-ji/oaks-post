import {
  PostsExcerptRule,
  PostsManager,
  sortDateAscend,
  sortDateDescend,
  sortLexOrderAscend,
  sortLexOrderDescend,
} from "./index.mjs";

const yourMarkdownDirectory = "test_markdown";
const yourJsonDirectory = "test_json";

const posts = new PostsManager({
  baseUrl: "https://neil-ji.github.io/",
  inputDir: yourMarkdownDirectory,
  outputDir: yourJsonDirectory,
  collection: {
    excerpt: {
      rule: PostsExcerptRule.CustomTag,
      tag: "<!--YOUR_TAG-->",
    },
    itemsPerPage: 4,
    sort: sortLexOrderDescend(),
  },
  tag: {
    sort: sortDateAscend(),
    itemsPerPage: 2,
    excerpt: {
      rule: PostsExcerptRule.ByLines,
      lines: 2,
    },
  },
  category: {
    sort: sortDateDescend(),
    itemsPerPage: 10,
    excerpt: {
      rule: PostsExcerptRule.ByLines,
      lines: 1,
    },
  },
});

async function run() {
  // await posts.clean();
  await posts.start();
}

run();
