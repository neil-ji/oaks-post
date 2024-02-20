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
  collections: {
    excerpt: {
      rule: PostsExcerptRule.CustomTag,
      tag: "<!--YOUR_TAG-->",
    },
    itemsPerPage: 3,
    sort: sortLexOrderDescend(),
  },
  tags: {},
});

async function run() {
  // await posts.clean();
  await posts.start();
}

run();
