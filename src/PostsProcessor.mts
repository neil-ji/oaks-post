import { createWriteStream } from "fs";
import fs from "fs/promises";
import grayMatter from "gray-matter";
import murmurhash from "murmurhash";
import { join } from "path";
import { pipeline } from "stream/promises";
import { PostsCollection } from "./PostsCollection.mjs";
import {
  getFileContent,
  getRelativePath,
  getUrlPath,
  normalizePath,
} from "./utils.mjs";

export interface PostsProcessorOptions {
  baseUrl?: string;
  markdownDirectory: string;
  jsonDirectory: string;
  descendByDate?: boolean;
}

export class PostsProcessor {
  private existedJsonPathMap: Map<string, string>;
  private collection: PostsCollection;
  private options: Required<Omit<PostsProcessorOptions, "descendByDate">>;

  constructor({
    descendByDate,
    baseUrl,
    markdownDirectory,
    jsonDirectory,
  }: PostsProcessorOptions) {
    this.existedJsonPathMap = new Map();
    this.collection = new PostsCollection(descendByDate);
    this.options = {
      baseUrl: baseUrl || "",
      markdownDirectory: normalizePath(markdownDirectory),
      jsonDirectory: normalizePath(jsonDirectory),
    };
  }

  private extractHashFromJsonFileName(
    jsonFileName: string
  ): string | undefined {
    const match = jsonFileName.match(/post_(\w+)\.json/);
    return match ? match[1] : undefined;
  }

  private async initProcessedFilesMap(outputDirectory: string) {
    try {
      const lastJsonFiles = await fs.readdir(outputDirectory);
      for (const jsonName of lastJsonFiles) {
        const hash = this.extractHashFromJsonFileName(jsonName);
        if (hash) {
          this.existedJsonPathMap.set(hash, join(outputDirectory, jsonName));
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

  private async processFile(markdownPath: string, jsonDirectory: string) {
    try {
      // 1. Calculate hash and skip file which has no changed .
      const markdownContent = await getFileContent(markdownPath);
      // Blending fileContent and inputFilePath to ensure that files never be ignored which have different filenames but same content.
      const markdownHash = this.calculateHash(markdownContent + markdownPath);

      if (this.existedJsonPathMap.has(markdownHash)) {
        // Removing validated entry in the map and at the final step deleting json files which remained in this map.
        this.existedJsonPathMap.delete(markdownHash);
        console.log(`${markdownPath} has not changed. Skipping...`);
        return;
      }

      // 2. Generate json file
      const { data: frontMatter, content } = grayMatter(markdownContent);
      const jsonContent = JSON.stringify({ frontMatter, content }, null, 0);
      const jsonFilename = `post_${markdownHash}.json`;
      const jsonPath = join(jsonDirectory, jsonFilename);
      const writeStream = createWriteStream(jsonPath, "utf-8");
      await pipeline(jsonContent, writeStream);

      // 3. Collect data of json file.
      this.collection.collect({
        url: getUrlPath(join(this.options.baseUrl, getRelativePath(jsonPath))),
        hash: markdownHash,
        frontMatter,
        content,
      });

      console.log(`Generate json file: ${jsonPath}`);
    } catch (error) {
      console.error(`Error processing file: ${markdownPath}`);
      console.error(error);
    }
  }

  public async processFiles() {
    const { jsonDirectory, markdownDirectory } = this.options;
    // 1. extract hash segment from last processed json files' names.
    this.initProcessedFilesMap(jsonDirectory);

    // 2. start process markdown files.
    try {
      const markdownFiles = await fs.readdir(markdownDirectory);
      const processHandlers = markdownFiles.map(async (markdownFilename) => {
        const markdownPath = join(markdownDirectory, markdownFilename);
        return this.processFile(markdownPath, jsonDirectory);
      });
      await Promise.all(processHandlers);
    } catch (error) {
      console.error("Error reading markdown files:", error);
    }

    // 3. start delete redundant json files which generated at last time but didn't correspond with any markdown files at this time.
    try {
      await Promise.all(
        [...this.existedJsonPathMap.values()].map(async (jsonPath) => {
          await fs.rm(jsonPath);
          console.log(`Delete json file: ${jsonPath}`);
        })
      );
    } catch (error) {
      console.error("Error deleting json files:", error);
    }

    // 4. start generate posts.json file which looks like 'table' of a database.
    this.collection.persist(jsonDirectory, [...this.existedJsonPathMap.keys()]);
  }
}
