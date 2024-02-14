import { PostsManager } from "./index.mjs";

// Define your test directories and files
const markdownDirectory = "test_markdown";
const jsonDirectory = "test_json";

// Run the function to be tested
const manager = new PostsManager({
  baseUrl: "https://neil-ji.github.io/",
  inputDir: markdownDirectory,
  outputDir: jsonDirectory,
  descending: true,
  maxItems: 3,
});

manager.start();
