import { mkdir, rename } from "fs/promises";
import { dirname, join, relative } from "path";
import {
  deleteDir,
  deleteFileRecursively,
  hasExisted,
  readByStream,
  writeByStream,
} from "./utils.mjs";
import grayMatter from "gray-matter";
import {
  FileNode,
  PostsGeneratorOptions,
  RawPostItem,
} from "./types/index.mjs";

export class PostsGenerator {
  private options: PostsGeneratorOptions;

  constructor(options: PostsGeneratorOptions) {
    this.options = options;
  }

  private getParentDir(path: string): string {
    return join(this.outputDir, relative(this.options.inputDir, dirname(path)));
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

      await writeByStream(jsonPath, jsonContent);

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
      await writeByStream(newJsonPath, jsonContent);

      console.log(`Update json file name: ${oldJsonPath} => ${newJsonPath}`);
      return { path: newJsonPath, hash: hash!, frontMatter, content };
    } catch (error) {
      console.error("Error: failed update post_[hash]_[key].json", error);
      process.exit(1);
    }
  }

  public async clean() {
    if (await hasExisted(this.outputDir)) {
      await deleteDir(this.outputDir);
    }
  }

  public get outputDir() {
    return this.options.outputDir;
  }
}
