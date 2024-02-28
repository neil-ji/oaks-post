import { FileProcessor } from "./FileProcessor.mjs";
import { PostsCollector } from "./PostsCollector.mjs";
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
  private collector: PostsCollector;
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
    this.collector = new PostsCollector(
      {
        outputDir: `${normalizedOutputDir}_${PostsCollector.dirname}`,
        ...collections,
        excerpt: {
          ...defaultExcerptOptions,
          ...collections?.excerpt,
        },
      },
      baseUrl,
      generateUniqueHash(JSON.stringify(collections))
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
        baseUrl,
        generateUniqueHash(JSON.stringify(tags))
      );
    }

    // Classifier instance
    if (categories && categories.rule !== PostsCategoriesAnalyzeRule.Disable) {
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
        baseUrl,
        generateUniqueHash(JSON.stringify(categories))
      );
    }
  }

  private async handleDelete({ json }: Change) {
    if (!json) return;
    const { hash, frontMatter } = await this.generator.delete(json);
    this.collector.delete(hash);
    this.tagger?.delete(hash, frontMatter);
    this.classifier?.delete(hash, frontMatter);
  }

  private async handleCreate({ markdown }: Change) {
    if (!markdown) return;
    const rawPost = await this.generator.create(markdown);
    this.collector.collect(rawPost);
    this.tagger?.collect(rawPost);
    this.classifier?.collect(rawPost);
  }

  private async handleModify(change: Required<Change>) {
    const { json, markdown } = change;
    const { oldItem, newItem } = await this.generator.modify(markdown, json);
    this.collector.modify(newItem, oldItem.hash);
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

  private forceSave() {
    const works = [
      this.collector.save(),
      this.tagger?.save(),
      this.classifier?.save(),
    ];

    return Promise.all(works);
  }

  private handleSave() {
    const works = [];
    if (this.collector.hasOptionsChanged) {
      console.log("Rebuild posts collection.");
      works.push(this.collector.save());
    }
    if (this.tagger?.hasOptionsChanged) {
      console.log("Rebuild tags collection.");
      works.push(this.tagger?.save());
    }
    if (this.classifier?.hasOptionsChanged) {
      console.log("Rebuild categories collection.");
      works.push(this.classifier?.save());
    }

    return Promise.all(works);
  }

  public async clean() {
    const works = [
      this.generator.clean(),
      this.collector.clean(),
      this.tagger?.clean(),
      this.classifier?.clean(),
    ];
    await Promise.all(works);
  }

  public async start() {
    console.time("Time");

    // 0. Validate directory.
    const hasInputDirExisted = await hasExisted(this.inputDir);
    if (!hasInputDirExisted) {
      throw new Error(
        "Make sure that inputDir which storages your markdown files was existed."
      );
    }
    await Promise.all([
      this.generator.preprocess(),
      this.collector.preprocess(),
      this.tagger?.preprocess(),
      this.classifier?.preprocess(),
    ]);

    // 1. Clear all json files if posts.json hasn't existed.
    const hasCollectionExist = await this.collector.hasExisted();
    const enableTags = this.tagger;
    const hasTagsExist = await this.tagger?.hasExisted();
    const enableCategories = this.classifier;
    const hasCategoriesExist = await this.classifier?.hasExisted();

    if (
      !hasCollectionExist ||
      (enableTags && !hasTagsExist) ||
      (enableCategories && !hasCategoriesExist)
    ) {
      await this.clean();
      await Promise.all([
        this.collector.init(),
        this.tagger?.init(),
        this.classifier?.init(),
      ]);
    }
    await Promise.all([
      this.collector.load(),
      this.tagger?.load(),
      this.classifier?.load(),
    ]);

    // 2. Read and compare files tree (markdown and json), simultaneously, collect changes of files.
    const fileProcessor = new FileProcessor();
    const markdownTree = await fileProcessor.build(this.inputDir);
    const jsonTree = await fileProcessor.build(this.outputDir);
    const changes = await fileProcessor.compare(markdownTree, jsonTree);

    // 3. Handle all changes.
    if (changes.length > 0) {
      await this.handleChanges(changes);
      await this.forceSave();
    } else {
      await this.handleSave();
    }
    console.log("Processing files is done.");
    console.timeEnd("Time");
  }
}
