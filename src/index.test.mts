import { PostsExcerptRule, PostsManager } from "./index.mjs";

const yourMarkdownDirectory = "test_markdown";
const yourJsonDirectory = "test_json";

const posts = new PostsManager({
  baseUrl: "https://neil-ji.github.io/",
  inputDir: yourMarkdownDirectory,
  outputDir: yourJsonDirectory,
  excerptOptions: {
    rule: PostsExcerptRule.CustomTag,
    tag: "<!--YOUR_TAG-->"
  },
  descending: true,
  maxItems: 3,
});

posts.start();
