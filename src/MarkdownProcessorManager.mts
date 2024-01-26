import fs from "fs/promises";
import { MarkdownProcessor } from "./MarkdownProcessor.mjs";

export class MarkdownProcessorManager {
  private processor: MarkdownProcessor;

  constructor() {
    this.processor = new MarkdownProcessor();
  }

  public async processFiles(
    markdownDirectory: string,
    outputDirectory: string
  ) {
    try {
      const markdownFiles = await fs.readdir(markdownDirectory);

      for (const fileName of markdownFiles) {
        const inputFilePath = `${markdownDirectory}/${fileName}`;
        const outputJsonFilePath = `${outputDirectory}/${fileName.replace(
          /\.md$/,
          ".json"
        )}`;
        await this.processor.processFile(inputFilePath, outputJsonFilePath);
      }
    } catch (error) {
      console.error("Error reading markdown files:", error);
    }
  }
}
