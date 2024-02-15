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

  public async create({ hash, path, key }: FileNode): Promise<RawPostItem> {
    try {
      const parentDir = join(
        this.outputDir,
        relative(this.inputDir, dirname(path))
      );
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
    } catch {
      throw new Error("Error: failed create post_[hash]_[key].json");
    }
  }

  public async delete(node: FileNode): Promise<string> {
    try {
      await deleteFileRecursively(node.path);

      console.log(`Delete json file: ${node.path}`);
      return node.hash!;
    } catch {
      throw new Error(`Failed delete file: ${node.path}`);
    }
  }

  public async modify(
    { hash, path, key }: FileNode,
    oldJsonPath: string
  ): Promise<RawPostItem> {
    try {
      const markdownContent = await readByStream(path);
      const { data: frontMatter, content } = grayMatter(markdownContent);

      const jsonContent = JSON.stringify({ frontMatter, content }, null, 0);
      const jsonFilename = `post_${hash}_${key}.json`;
      const newJsonPath = join(this.outputDir, jsonFilename);

      await rename(oldJsonPath, newJsonPath);

      const writeStream = createWriteStream(newJsonPath, "utf-8");
      await pipeline(jsonContent, writeStream);

      console.log(`Update json file name: ${oldJsonPath} => ${newJsonPath}`);
      return { path: newJsonPath, hash: hash!, frontMatter, content };
    } catch {
      throw new Error("Error: failed update post_[hash]_[key].json");
    }
  }
}

export interface RawPostItem {
  path: string;
  hash: string;
  frontMatter: PostFrontMatter;
  content: string;
}
