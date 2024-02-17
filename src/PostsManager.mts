import { access, readdir, rm } from "fs/promises";
import { join } from "path";
import { Change, FileTree } from "./FileTree.mjs";
import { PostItem, PostsCollection } from "./PostsCollection.mjs";
import { PostsGenerator, RawPostItem } from "./PostsGenerator.mjs";
import { PostsPaginator } from "./PostsPaginator.mjs";
import {
  deleteDir,
  ensureDirExisted,
  generateUniqueHash,
  getCustomExcerpt,
  getExcerpt,
  getRelativePath,
  getUrlPath,
  normalizePath,
} from "./utils.mjs";

export class PostsManager {
  private collection: PostsCollection;
  private generator: PostsGenerator;
  private options: Required<
    Omit<PostsManagerOptions, "descending" | "maxItems"> & {
      excerptOptions: Required<PostsExcerptOptions>;
    }
  > & { maxItems?: number };

  constructor({
    descending,
    baseUrl = "",
    inputDir,
    outputDir,
    excerptOptions,
    maxItems,
  }: PostsManagerOptions) {
    // validate input
    if (inputDir === "") {
      throw new Error("Option 'inputDir' cannot be empty.");
    }
    if (outputDir === "") {
      outputDir = `json_${generateUniqueHash()}`;
      console.warn(
        `Warning: You have not specified 'outputDir'. Therefore, it will be replaced with '${outputDir}'`
      );
    }
    if (outputDir === inputDir) {
      outputDir = `json_${generateUniqueHash(inputDir)}`;
      console.warn(
        `Warning: It's NOT SAFE for outputDir and inputDir to be the same. Therefore, outputDir will be replaced with '${outputDir}' by default.`
      );
    }
    // normalize input & create object
    const normalizedInputDir = normalizePath(inputDir);
    const normalizedOutputDir = normalizePath(outputDir);

    this.collection = new PostsCollection(
      `${normalizedOutputDir}_database`,
      descending
    );
    this.generator = new PostsGenerator(
      normalizedInputDir,
      normalizedOutputDir
    );
    this.options = {
      baseUrl,
      inputDir: normalizedInputDir,
      outputDir: normalizedOutputDir,
      excerptOptions: {
        rule: PostsExcerptRule.ByLines,
        lines: 5,
        tag: "<!--more-->",
        ...excerptOptions,
      },
      maxItems,
    };
  }

  private processRawPostItem({
    path,
    hash,
    frontMatter,
    content,
  }: RawPostItem): PostItem {
    const {
      baseUrl,
      excerptOptions: { rule, lines, tag },
    } = this.options;
    return {
      url: getUrlPath(join(baseUrl, getRelativePath(path))),
      hash,
      frontMatter,
      excerpt:
        rule === PostsExcerptRule.ByLines
          ? getExcerpt(content, lines)
          : getCustomExcerpt(content, tag),
    };
  }

  private async handleDelete({ json }: Change) {
    if (!json) return;
    const hash = await this.generator.delete(json);
    this.collection.delete(hash);
  }

  private async handleCreate({ markdown }: Change) {
    if (!markdown) return;
    const rawPost = await this.generator.create(markdown);
    const post = this.processRawPostItem(rawPost);
    this.collection.collect(post);
  }

  private async handleModify(change: Required<Change>) {
    const { json, markdown } = change;
    const rawPost = await this.generator.modify(markdown, json.path);
    const post = this.processRawPostItem(rawPost);
    this.collection.modify(post, json.hash);
  }

  private async handleChanges(changes: Change[]) {
    for (const change of changes) {
      await (this[`handle${change.type}`] as (c: Change) => Promise<void>)(
        change
      );
    }
  }

  private async clearAll() {
    const { outputDir } = this.options;
    await deleteDir(outputDir);
    await deleteDir(`${outputDir}_database`);
  }

  public async start() {
    const { inputDir, outputDir, maxItems, baseUrl } = this.options;

    // 0. Validate directory.
    try {
      await access(inputDir);
    } catch (error) {
      throw new Error("Make sure that inputDir was existed.");
    }
    await ensureDirExisted(outputDir);
    await ensureDirExisted(`${outputDir}_database`);

    // 1. Clear all json files if posts.json hasn't existed.
    if (!(await this.collection.hasExisted())) {
      await this.clearAll();
      await this.collection.init();
    }
    await this.collection.load();

    // 2. Read and compare files tree (markdown and json), simultaneously, collect changes of files.
    const changes = await new FileTree(inputDir, outputDir).compare();

    // 3. Handle all changes.
    if (changes.length > 0) {
      await this.handleChanges(changes);
      await this.collection.save();
    } else {
      console.log("Files have no changes.");
    }

    // 4. Paginate.
    await PostsPaginator.clear(outputDir);

    if (maxItems !== undefined) {
      new PostsPaginator({
        maxItems: Number.isInteger(maxItems) ? maxItems : 10,
        outputDir: `${outputDir}_database`,
        baseUrl,
      }).paginate(this.collection.posts);
    }
  }
}

export enum PostsExcerptRule {
  ByLines = 1,
  CustomTag = 2,
}

export interface PostsExcerptOptions {
  rule: PostsExcerptRule;
  lines?: number;
  tag?: string;
}

export interface PostsManagerOptions {
  baseUrl?: string;
  inputDir: string;
  outputDir: string;
  descending?: boolean;
  excerptOptions?: PostsExcerptOptions;
  maxItems?: number;
}
