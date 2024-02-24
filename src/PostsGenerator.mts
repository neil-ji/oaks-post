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
  Post,
  PostsGeneratorOptions,
  RawPostsItem,
} from "./types/index.mjs";

export class PostsGenerator {
  private options: PostsGeneratorOptions;

  constructor(options: PostsGeneratorOptions) {
    this.options = options;
  }

  private getParentDir(path: string): string {
    return join(this.outputDir, relative(this.options.inputDir, dirname(path)));
  }

  public async create({ hash, path, key }: FileNode): Promise<RawPostsItem> {
    try {
      // Make directories
      const parentDir = this.getParentDir(path);
      await mkdir(parentDir, {
        recursive: true,
      });

      // Read and analyze markdown file
      const markdownContent = await readByStream(path);
      const { data: frontMatter, content } = grayMatter(markdownContent);

      // Create JSON file
      const jsonContent = JSON.stringify({ frontMatter, content }, null, 0);
      const jsonFilename = `post_${hash}_${key}.json`;
      const jsonPath = join(parentDir, jsonFilename);
      await writeByStream(jsonPath, jsonContent);
      console.log(`Generate post: ${jsonPath}`);

      return { path: jsonPath, hash: hash!, frontMatter, content };
    } catch (error) {
      console.error("Error: failed create post_[hash]_[key].json", error);
      process.exit(1);
    }
  }

  public async delete(node: FileNode): Promise<RawPostsItem> {
    try {
      // Record file content before delete it
      const deletedFileContent = await readByStream(node.path);
      const { frontMatter, content } = JSON.parse(deletedFileContent);

      // Delete file
      await deleteFileRecursively(node.path);
      console.log(`Delete post: ${node.path}`);

      return { path: node.path, hash: node.hash!, frontMatter, content };
    } catch (error) {
      console.error(`Failed delete file: ${node.path}`, error);
      process.exit(1);
    }
  }

  public async modify(
    { hash, path, key }: FileNode,
    json: FileNode
  ): Promise<{ newItem: RawPostsItem; oldItem: RawPostsItem }> {
    try {
      // Make directories
      const parentDir = this.getParentDir(path);

      // Read and analyze markdown file
      const markdownContent = await readByStream(path);
      const { data: frontMatter, content } = grayMatter(markdownContent);

      // Record old json file before modify it
      const oldFileContent = await readByStream(json.path);
      const oldFile: Post = JSON.parse(oldFileContent);

      // Rename and update json file
      const newFileContent = JSON.stringify({ frontMatter, content }, null, 0);
      const newFilename = `post_${hash}_${key}.json`;
      const newFilePath = join(parentDir, newFilename);
      await rename(json.path, newFilePath);
      await writeByStream(newFilePath, newFileContent);
      console.log(`Update post: ${json.path} => ${newFilePath}`);

      return {
        newItem: { path: newFilePath, hash: hash!, frontMatter, content },
        oldItem: { ...oldFile, path: json.path, hash: json.hash! },
      };
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
