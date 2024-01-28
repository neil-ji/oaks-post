import path from "path";
import { PostsProcessor } from "./index.mjs";

// Define your test directories and files
const markdownDirectory = path.join(process.cwd(), "test_markdown");
const jsonDirectory = path.join(process.cwd(), "test_json");

// Run the function to be tested
const markdownProcessor = new PostsProcessor({
  markdownDirectory,
  jsonDirectory,
  descendByDate: true,
});
await markdownProcessor.processFiles();
