import { PostsProcessor } from "./index.mjs";

// Define your test directories and files
const markdownDirectory = "test_markdown";
const jsonDirectory = "test_json";

// Run the function to be tested
const markdownProcessor = new PostsProcessor({
  baseUrl: "https://neil-ji.github.io/",
  markdownDirectory,
  jsonDirectory,
  descending: true,
  maxItems: 3,
});
await markdownProcessor.processFiles();
