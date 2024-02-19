import { access } from "fs/promises";
import { FileTree } from "./FileTree.mjs";
import { PostsCollection } from "./PostsCollection.mjs";
import { PostsGenerator } from "./PostsGenerator.mjs";
import { PostsPaginator } from "./PostsPaginator.mjs";
import {
  deleteDir,
  ensureDirExisted,
  generateUniqueHash,
  normalizePath,
} from "./utils.mjs";
import { PostsManagerOptions, Change } from "./types";

export class PostsManager {
  private collection: PostsCollection;
  private generator: PostsGenerator;
  private paginator?: PostsPaginator;
  private inputDir: string;
  private outputDir: string;
  private databaseDir: string;

  constructor({
    inputDir,
    outputDir,
    baseUrl,
    itemsPerPage,
    sort,
    excerpt,
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
    const databaseDir = `${normalizedOutputDir}_database`;

    this.inputDir = normalizedInputDir;
    this.outputDir = normalizedOutputDir;
    this.databaseDir = databaseDir;
    this.collection = new PostsCollection(databaseDir, {
      baseUrl,
      sort,
      excerpt,
    });
    this.generator = new PostsGenerator(
      normalizedInputDir,
      normalizedOutputDir
    );
    if (itemsPerPage !== undefined) {
      this.paginator = new PostsPaginator({
        itemsPerPage,
        outputDir: databaseDir,
        baseUrl,
      });
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
    for (const change of changes) {
      await (this[`handle${change.type}`] as (c: Change) => Promise<void>)(
        change
      );
    }
  }

  private async clearAll() {
    await deleteDir(this.outputDir);
    await deleteDir(this.databaseDir);
  }

  public async start() {
    // 0. Validate directory.
    try {
      await access(this.inputDir);
    } catch (error) {
      throw new Error("Make sure that inputDir was existed.");
    }
    await ensureDirExisted(this.outputDir);
    await ensureDirExisted(this.databaseDir);

    // 1. Clear all json files if posts.json hasn't existed.
    if (!(await this.collection.hasExisted())) {
      await this.clearAll();
      await this.collection.init();
    }
    await this.collection.load();

    // 2. Read and compare files tree (markdown and json), simultaneously, collect changes of files.
    const fileTree = new FileTree(this.inputDir, this.outputDir);
    const changes = await fileTree.compare();

    // 3. Handle all changes.
    if (changes.length > 0) {
      await this.handleChanges(changes);
      this.collection.sort();
      await this.collection.save();
    } else {
      console.log("Files have no changes.");
    }

    // 4. Paginate.
    await PostsPaginator.clean(this.databaseDir);
    await this.paginator?.paginate(this.collection.posts);

    // 5. Process tag.
  }

  public async clean() {
    console.log(
      "Clean all files in the paths:",
      this.outputDir,
      this.databaseDir
    );
    await this.clearAll();
  }
}
