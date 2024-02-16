import { createWriteStream } from "fs";
import { mkdir, rename } from "fs/promises";
import grayMatter from "gray-matter";
import { dirname, join, relative, resolve } from "path";
import { pipeline } from "stream/promises";
import { FileNode } from "./FileTree.mjs";
import { PostFrontMatter } from "./PostsCollection.mjs";
import { deleteFileRecursively, readByStream } from "./utils.mjs";

export class PostsGenerator {
  private inputDir: string;
  private outputDir: string;

  constructor(inputDir: string, outputDir: string) {
    this.outputDir = outputDir;
    this.inputDir = inputDir;
  }

  private getParentDir(path: string): string {
    return join(this.outputDir, relative(this.inputDir, dirname(path)));
  }

  public async create({ hash, path, key }: FileNode): Promise<RawPostItem> {
    try {
      const parentDir = this.getParentDir(path);
      await mkdir(parentDir, {
        recursive: true,
      });

      const markdownContent = await readByStream(path);
      const { data: frontMatter, content } = grayMatter(markdownContent);

      const jsonContent = JSON.stringify({ frontMatter, content }, null, 0);
      const jsonFilename = `post_${hash}_${key}.json`;
      const jsonPath = join(parentDir, jsonFilename);

      const writeStream = createWriteStream(jsonPath, "utf-8");
      await pipeline(jsonContent, writeStream);

      console.log(`Generate json file: ${jsonPath}`);
      return { path: jsonPath, hash: hash!, frontMatter, content };
    } catch (error) {
      console.error("Error: failed create post_[hash]_[key].json", error);
      process.exit(1);
    }
  }

  public async delete(node: FileNode): Promise<string> {
    try {
      await deleteFileRecursively(node.path);

      console.log(`Delete json file: ${node.path}`);
      return node.hash!;
    } catch (error) {
      console.error(`Failed delete file: ${node.path}`, error);
      process.exit(1);
    }
  }

  public async modify(
    { hash, path, key }: FileNode,
    oldJsonPath: string
  ): Promise<RawPostItem> {
    try {
      const parentDir = this.getParentDir(path);

      const markdownContent = await readByStream(path);
      const { data: frontMatter, content } = grayMatter(markdownContent);

      const jsonContent = JSON.stringify({ frontMatter, content }, null, 0);
      const jsonFilename = `post_${hash}_${key}.json`;
      const newJsonPath = join(parentDir, jsonFilename);

      await rename(oldJsonPath, newJsonPath);

      const writeStream = createWriteStream(newJsonPath, "utf-8");
      await pipeline(jsonContent, writeStream);

      console.log(`Update json file name: ${oldJsonPath} => ${newJsonPath}`);
      return { path: newJsonPath, hash: hash!, frontMatter, content };
    } catch (error) {
      console.error("Error: failed update post_[hash]_[key].json", error);
      process.exit(1);
    }
  }
}

export interface RawPostItem {
  path: string;
  hash: string;
  frontMatter: PostFrontMatter;
  content: string;
}
