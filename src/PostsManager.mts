import { access } from "fs/promises";
import { FileTree } from "./FileTree.mjs";
import { PostsCollection } from "./PostsCollection.mjs";
import { PostsGenerator } from "./PostsGenerator.mjs";
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
import {
  PostsManagerOptions,
  Change,
  PostItem,
  PostsExcerptRule,
  RawPostItem,
} from "./types/index.mjs";
import { join } from "path";
import { PostsTagger } from "./PostsTagger.mjs";

export class PostsManager {
  private collection: PostsCollection;
  private generator: PostsGenerator;
  private tagger?: PostsTagger;
  private inputDir: string;
  private outputDir: string;

  constructor({
    inputDir,
    outputDir,
    baseUrl = "",
    collections,
    tags,
  }: PostsManagerOptions) {
    // Validate input
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
    // Normalize input
    const normalizedInputDir = normalizePath(inputDir);
    const normalizedOutputDir = normalizePath(outputDir);
    const defaultExcerptOptions = {
      rule: PostsExcerptRule.ByLines,
      lines: 5,
      tag: "<!--more-->",
    };

    this.inputDir = normalizedInputDir;
    this.outputDir = normalizedOutputDir;

    // Collection instance
    this.collection = new PostsCollection(
      {
        outputDir: `${normalizedOutputDir}_${PostsCollection.basename}`,
        ...collections,
        excerpt: {
          ...defaultExcerptOptions,
          ...collections?.excerpt,
        },
      },
      baseUrl
    );

    // Generator instance
    this.generator = new PostsGenerator({
      inputDir: normalizedInputDir,
      outputDir: normalizedOutputDir,
    });

    // Tagger instance
    if (tags) {
      this.tagger = new PostsTagger(
        {
          outputDir: `${normalizedOutputDir}_${PostsTagger.basename}`,
          propName: tags.propName || "tag",
          ...tags,
          excerpt: {
            ...defaultExcerptOptions,
            ...tags.excerpt,
          },
        },
        baseUrl
      );
    }
  }

  private async handleDelete({ json }: Change) {
    if (!json) return;
    const hash = await this.generator.delete(json);
    this.collection.delete(hash);
  }

  private async handleCreate({ markdown }: Change) {
    if (!markdown) return;
    const rawPost = await this.generator.create(markdown);
    this.collection.collect(rawPost);
  }

  private async handleModify(change: Required<Change>) {
    const { json, markdown } = change;
    const rawPost = await this.generator.modify(markdown, json.path);
    this.collection.modify(rawPost, json.hash);
  }

  private async handleChanges(changes: Change[]) {
    // Check existence of the generator output directory.
    await ensureDirExisted(this.generator.outputDir);

    // Handle all changes.
    for (const change of changes) {
      await (this[`handle${change.type}`] as (c: Change) => Promise<void>)(
        change
      );
    }
  }

  public async clean() {
    this.generator.clean();
    this.collection.clean();
    this.tagger?.clean();
  }

  public async start() {
    // 0. Validate directory.
    try {
      await access(this.inputDir);
    } catch (error) {
      throw new Error(
        "Make sure that inputDir which storages your markdown files was existed."
      );
    }

    // 1. Clear all json files if posts.json hasn't existed.
    await ensureDirExisted(this.collection.outputDir);

    if (!(await this.collection.hasExisted())) {
      await this.clean();
      await this.collection.init();
    }
    await this.collection.load();

    // 2. Read and compare files tree (markdown and json), simultaneously, collect changes of files.
    const fileTree = new FileTree(this.inputDir, this.outputDir);
    const changes = await fileTree.compare();

    // 3. Handle all changes.
    if (changes.length > 0) {
      await this.handleChanges(changes);
      await this.collection.save();
    } else {
      console.log("Files have no changes.");
    }

    // 4. Analyze all tags.
    if (this.tagger) {
      // Check existence of tags directory
      await ensureDirExisted(this.tagger.outputDir);
      await this.tagger.clean();
      await this.tagger.start(this.collection.posts);
    }
  }
}
