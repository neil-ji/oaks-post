import { createWriteStream } from "fs";
import { rm } from "fs/promises";
import grayMatter from "gray-matter";
import { join } from "path";
import { pipeline } from "stream/promises";
import { FileNode } from "./FileTree.mjs";
import { PostFrontMatter } from "./PostsCollection.mjs";
import { readByStream } from "./utils.mjs";
import { deleteAsync } from "del";

export class PostsGenerator {
  private outputDir: string;

  constructor(outputDir: string) {
    this.outputDir = outputDir;
  }

  public async create({ hash, path, key }: FileNode): Promise<RawPostItem> {
    try {
      const markdownContent = await readByStream(path);
      const { data: frontMatter, content } = grayMatter(markdownContent);

      const jsonContent = JSON.stringify({ frontMatter, content }, null, 0);
      const jsonFilename = `post_${hash}_${key}.json`;
      const jsonPath = join(this.outputDir, jsonFilename);

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
      await deleteAsync(node.path);
      return node.hash!;
    } catch {
      throw new Error(`Failed delete file: ${node.path}`);
    }
  }
}

export interface RawPostItem {
  path: string;
  hash: string;
  frontMatter: PostFrontMatter;
  content: string;
}
