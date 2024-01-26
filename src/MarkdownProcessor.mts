import { createReadStream, createWriteStream } from "fs";
import murmurhash from "murmurhash";
import grayMatter from "gray-matter";
import { pipeline } from "stream/promises";

export class MarkdownProcessor {
  private calculateHash(content: string) {
    const hash = murmurhash.v3(content);
    return hash.toString(16);
  }

  private async readFileContent(inputFilePath: string): Promise<string> {
    const readStream = createReadStream(inputFilePath, "utf-8");
    const chunks: string[] = [];

    // Read file content
    for await (const chunk of readStream) {
      chunks.push(chunk);
    }

    return chunks.join("");
  }

  private async generateJsonContent(
    inputFilePath: string,
    fileContent: string
  ): Promise<string> {
    const { data: frontMatter, content } = grayMatter(fileContent);

    // Get last hash value, default to an empty string if it doesn't exist
    const lastContentHash = frontMatter.contentHash || "";

    // Calculate current file content hash value
    const currentContentHash = this.calculateHash(content);

    // Only regenerate the JSON file if the hash values are different
    if (currentContentHash !== lastContentHash) {
      // Add hash value to frontMatter
      frontMatter.contentHash = currentContentHash;

      // Generate JSON content
      const jsonData = {
        frontMatter,
        content,
      };

      return JSON.stringify(jsonData, null, 2);
    } else {
      console.log(`${inputFilePath} has not changed. Skipping...`);
      return "";
    }
  }

  private async writeToFile(content: string, filePath: string) {
    const writeStream = createWriteStream(filePath, "utf-8");
    await pipeline(content, writeStream);
  }

  public async processFile(
    inputFilePath: string,
    outputJsonFilePath: string
  ) {
    try {
      const fileContent = await this.readFileContent(inputFilePath);
      const jsonContent = await this.generateJsonContent(
        inputFilePath,
        fileContent
      );

      if (jsonContent) {
        await this.writeToFile(jsonContent, outputJsonFilePath);

        // Update Markdown file with currentContentHash
        const updatedFileContent = grayMatter.stringify(
          fileContent,
          JSON.parse(jsonContent).frontMatter
        );
        await this.writeToFile(updatedFileContent, inputFilePath);
      }
    } catch (error) {
      console.error(`Error processing file: ${inputFilePath}`);
      console.error(error);
    }
  }
}
