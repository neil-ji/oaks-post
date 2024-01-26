import fs from "fs/promises";
import { createReadStream, createWriteStream } from "fs";
import murmurhash from "murmurhash";
import grayMatter from "gray-matter";
import { pipeline } from "stream/promises";

const calculateHash = (content) => {
  const hash = murmurhash.v3(content);
  return hash.toString(16);
};

const processMarkdownFile = async (inputFilePath, outputJsonFilePath) => {
  try {
    const readStream = createReadStream(inputFilePath, "utf-8");
    const chunks = [];

    // Read file content
    for await (const chunk of readStream) {
      chunks.push(chunk);
    }

    const fileContent = chunks.join("");
    const { data: frontMatter, content } = grayMatter(fileContent);

    // Get last hash value, default to an empty string if it doesn't exist
    const lastContentHash = frontMatter.contentHash || "";

    // Calculate current file content hash value
    const currentContentHash = calculateHash(content);

    // Only regenerate the JSON file if the hash values are different
    if (currentContentHash !== lastContentHash) {
      // Add hash value to frontMatter
      frontMatter.contentHash = currentContentHash;

      // Generate JSON content
      const jsonData = {
        frontMatter,
        content,
      };

      // Use asynchronous stream for writing JSON file
      const jsonString = JSON.stringify(jsonData, null, 2);
      const writeStreamJson = createWriteStream(outputJsonFilePath, "utf-8");
      await pipeline(jsonString, writeStreamJson);

      // Update Markdown file with currentContentHash
      const updatedFileContent = grayMatter.stringify(content, frontMatter);
      const writeStreamMarkdown = createWriteStream(inputFilePath, "utf-8");
      await pipeline(updatedFileContent, writeStreamMarkdown);
    } else {
      console.log(`${inputFilePath} has not changed. Skipping...`);
    }
  } catch (error) {
    console.error(`Error processing file: ${inputFilePath}`);
    console.error(error);
  }
};

const processMarkdownFiles = async (markdownDirectory, outputDirectory) => {
  try {
    const markdownFiles = await fs.readdir(markdownDirectory);

    for (const fileName of markdownFiles) {
      const inputFilePath = `${markdownDirectory}/${fileName}`;
      const outputJsonFilePath = `${outputDirectory}/${fileName.replace(
        /\.md$/,
        ".json"
      )}`;
      await processMarkdownFile(inputFilePath, outputJsonFilePath);
    }
  } catch (error) {
    console.error("Error reading markdown files:", error);
  }
};

export { processMarkdownFiles };
