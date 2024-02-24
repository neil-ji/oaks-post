import { FileProcessor } from "./FileProcessor.mjs";
import { PostsCollection } from "./PostsCollection.mjs";
import { PostsGenerator } from "./PostsGenerator.mjs";
import {
  ensureDirExisted,
  generateUniqueHash,
  hasExisted,
  normalizePath,
} from "./utils.mjs";
import {
  PostsManagerOptions,
  Change,
  PostsExcerptRule,
  PostsCategoriesAnalyzeRule,
} from "./types/index.mjs";
import { PostsTagger } from "./PostsTagger.mjs";
import { PostsClassifier } from "./PostsClassifier.mjs";

export class PostsManager {
  private collection: PostsCollection;
  private generator: PostsGenerator;
  private tagger?: PostsTagger;
  private classifier?: PostsClassifier;
  private inputDir: string;
  private outputDir: string;

  constructor({
    inputDir,
    outputDir,
    baseUrl = "",
    collections,
    tags,
    categories,
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
    if (categories) {
      this.classifier = new PostsClassifier(
        {
          outputDir: `${normalizedOutputDir}_${PostsClassifier.basename}`,
          rule: categories.rule || PostsCategoriesAnalyzeRule.FrontMatter,
          propName: categories.propName || "category",
          ...categories,
          excerpt: {
            ...defaultExcerptOptions,
            ...categories.excerpt,
          },
        },
        baseUrl
      );
    }
  }

  private async handleDelete({ json }: Change) {
    if (!json) return;
    const { hash, frontMatter } = await this.generator.delete(json);
    this.collection.delete(hash);
    this.tagger?.delete(hash, frontMatter);
    this.classifier?.delete(hash, frontMatter);
  }

  private async handleCreate({ markdown }: Change) {
    if (!markdown) return;
    const rawPost = await this.generator.create(markdown);
    this.collection.collect(rawPost);
    this.tagger?.collect(rawPost);
    this.classifier?.collect(rawPost);
  }

  private async handleModify(change: Required<Change>) {
    const { json, markdown } = change;
    const { oldItem, newItem } = await this.generator.modify(markdown, json);
    this.collection.modify(newItem, oldItem.hash);
    this.tagger?.modify(newItem, oldItem);
    this.classifier?.modify(newItem, oldItem);
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
    const works = [
      this.generator.clean(),
      this.collection.clean(),
      this.tagger?.clean(),
      this.classifier?.clean(),
    ];
    await Promise.all(works);
  }

  public async start() {
    // 0. Validate directory.
    const hasInputDirExisted = await hasExisted(this.inputDir);
    if (!hasInputDirExisted) {
      throw new Error(
        "Make sure that inputDir which storages your markdown files was existed."
      );
    }
    await this.collection.preprocess();
    await this.tagger?.preprocess();
    await this.classifier?.preprocess();

    // 1. Clear all json files if posts.json hasn't existed.
    const hasCollectionExist = await this.collection.hasExisted();
    const hasTagsExist = this.tagger && (await this.tagger.hasExisted());
    const hasCategoriesExist =
      this.classifier && (await this.classifier.hasExisted());

    if (!hasCollectionExist || !hasTagsExist || !hasCategoriesExist) {
      await this.clean();
      await this.collection.init();
      await this.tagger?.init();
      await this.classifier?.init();
    }
    await this.collection.load();
    await this.tagger?.load();
    await this.classifier?.load();

    // 2. Read and compare files tree (markdown and json), simultaneously, collect changes of files.
    const fileProcessor = new FileProcessor();
    const markdownTree = await fileProcessor.build(this.inputDir);
    const jsonTree = await fileProcessor.build(this.outputDir);
    const changes = await fileProcessor.compare(markdownTree, jsonTree);

    // 3. Handle all changes.
    if (changes.length > 0) {
      await this.handleChanges(changes);
      await this.collection.save();
      await this.tagger?.save();
      await this.classifier?.save();
    } else {
      console.log("Files have no changes.");
    }
  }
}
