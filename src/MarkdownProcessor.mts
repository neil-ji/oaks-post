import { createReadStream, createWriteStream } from "fs";
import fs from "fs/promises";
import grayMatter from "gray-matter";
import murmurhash from "murmurhash";
import { pipeline } from "stream/promises";

export class MarkdownProcessor {
  private processedFileHashSet: Set<string>;

  constructor() {
    this.processedFileHashSet = new Set();
  }

  private extractHashFromJsonFileName(
    jsonFileName: string
  ): string | undefined {
    const match = jsonFileName.match(/post_(\w+).json/);
    return match ? match[1] : undefined;
  }

  private async initProcessedFilesHashSet(outputDirectory: string) {
    try {
      const lastJsonFiles = await fs.readdir(outputDirectory);
      for (const fileName of lastJsonFiles) {
        const hash = this.extractHashFromJsonFileName(fileName);
        if (hash) {
          this.processedFileHashSet.add(hash);
        }
      }
    } catch (error) {
      console.error("Error reading json files:", error);
    }
  }

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

  private async processFile(inputFilePath: string, outputDirectory: string) {
    try {
      const fileContent = await this.readFileContent(inputFilePath);
      // blending fileContent and inputFilePath to ensure that files are processed which has different filenames but same content.
      const fileContentHash = this.calculateHash(fileContent + inputFilePath);

      if (this.processedFileHashSet.has(fileContentHash)) {
        console.log(`${inputFilePath} has not changed. Skipping...`);
        return;
      }

      const jsonContent = JSON.stringify(grayMatter(fileContent), null, 2);
      const outputJsonFilePath = `${outputDirectory}/post_${fileContentHash}.json`;

      const writeStream = createWriteStream(outputJsonFilePath, "utf-8");
      await pipeline(jsonContent, writeStream);
    } catch (error) {
      console.error(`Error processing file: ${inputFilePath}`);
      console.error(error);
    }
  }

  public async processFiles(
    markdownDirectory: string,
    outputDirectory: string
  ) {
    // extract hash segment from last processed json files' names.
    this.initProcessedFilesHashSet(outputDirectory);

    // start process markdown files.
    try {
      const markdownFiles = await fs.readdir(markdownDirectory);

      for (const fileName of markdownFiles) {
        const inputFilePath = `${markdownDirectory}/${fileName}`;
        await this.processFile(inputFilePath, outputDirectory);
      }
    } catch (error) {
      console.error("Error reading markdown files:", error);
    }
  }
}
