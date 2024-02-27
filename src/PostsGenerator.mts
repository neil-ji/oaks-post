import { mkdir, rename } from "fs/promises";
import { basename, dirname, join } from "path";
import {
  deleteDir,
  deleteFileRecursively,
  ensureDirExisted,
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

  public async preprocess() {
    return ensureDirExisted(this.outputDir);
  }

  public async create({
    hash,
    relativePath,
    abstractPath,
  }: FileNode): Promise<RawPostsItem> {
    try {
      // Make directories
      const parentDir = join(this.outputDir, dirname(relativePath));
      await mkdir(parentDir, {
        recursive: true,
      });

      // Read and analyze markdown file
      const markdownContent = await readByStream(abstractPath);
      const { data: frontMatter, content } = grayMatter(markdownContent);

      // Create JSON file
      const post: Post = { hash, frontMatter, content };
      const jsonContent = JSON.stringify(post, null, 0);
      const jsonFilename = `${basename(abstractPath, ".md")}.json`;
      const jsonPath = join(parentDir, jsonFilename);
      await writeByStream(jsonPath, jsonContent);
      console.log(`Generate post: ${jsonPath}`);

      return { path: jsonPath, hash, frontMatter, content };
    } catch (error) {
      console.error("Error: failed create post_[hash]_[key].json", error);
      process.exit(1);
    }
  }

  public async delete({ abstractPath, hash }: FileNode): Promise<RawPostsItem> {
    try {
      // Record file content before delete it
      const deletedFileContent = await readByStream(abstractPath);
      const { frontMatter, content } = JSON.parse(deletedFileContent);

      // Delete file
      await deleteFileRecursively(abstractPath);
      console.log(`Delete post: ${abstractPath}`);

      return { path: abstractPath, hash, frontMatter, content };
    } catch (error) {
      console.error(`Failed delete file: ${abstractPath}`, error);
      process.exit(1);
    }
  }

  public async modify(
    { hash, abstractPath, relativePath }: FileNode,
    json: FileNode
  ): Promise<{ newItem: RawPostsItem; oldItem: RawPostsItem }> {
    try {
      // Read and analyze markdown file
      const markdownContent = await readByStream(abstractPath);
      const { data: frontMatter, content } = grayMatter(markdownContent);

      // Record old json file before modify it
      const oldFileContent = await readByStream(json.abstractPath);
      const oldPost: Post = JSON.parse(oldFileContent);

      // Update json file
      const newPost: Post = { hash, frontMatter, content };
      const newFileContent = JSON.stringify(newPost, null, 0);
      await writeByStream(json.abstractPath, newFileContent);
      console.log(`Update post: ${json.abstractPath}`);

      return {
        newItem: { ...newPost, path: json.abstractPath },
        oldItem: { ...oldPost, path: json.abstractPath },
      };
    } catch (error) {
      console.error(`Failed update ${json.abstractPath}`, error);
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
