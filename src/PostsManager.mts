import { FileProcessor } from "./FileProcessor.mjs";
import { PostsCollector } from "./PostsCollector.mjs";
import { PostsGenerator } from "./PostsGenerator.mjs";
import {
  ensureDirExist,
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
import { join } from "path";

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
    collection,
    tag,
    category,
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
    this.inputDir = normalizedInputDir;
    this.outputDir = normalizedOutputDir;
    const defaultExcerptOptions = {
      rule: PostsExcerptRule.ByLines,
      lines: 5,
      tag: "<!--more-->",
    };

    // Collection instance
    this.collector = new PostsCollector(
      {
        outputDir: join(normalizedOutputDir, PostsCollector.dirname),
        ...collection,
        excerpt: {
          ...defaultExcerptOptions,
          ...collection?.excerpt,
        },
      },
      baseUrl,
      generateUniqueHash(JSON.stringify(collection))
    );

    // Generator instance
    this.generator = new PostsGenerator({
      inputDir: normalizedInputDir,
      outputDir: join(normalizedOutputDir, PostsGenerator.dirname),
    });

    // Tagger instance
    if (tag) {
      this.tagger = new PostsTagger(
        {
          outputDir: join(normalizedOutputDir, PostsTagger.dirname),
          propName: tag.propName || "tag",
          ...tag,
          excerpt: {
            ...defaultExcerptOptions,
            ...tag.excerpt,
          },
        },
        baseUrl,
        generateUniqueHash(JSON.stringify(tag))
      );
    }

    // Classifier instance
    if (category && category.rule !== PostsCategoriesAnalyzeRule.Disable) {
      this.classifier = new PostsClassifier(
        {
          outputDir: join(normalizedOutputDir, PostsClassifier.dirname),
          rule: category.rule || PostsCategoriesAnalyzeRule.FrontMatter,
          propName: category.propName || "category",
          ...category,
          excerpt: {
            ...defaultExcerptOptions,
            ...category.excerpt,
          },
        },
        baseUrl,
        generateUniqueHash(JSON.stringify(category))
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
    await ensureDirExist(this.generator.outputDir);

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
      console.log(
        "Rebuild posts collection because of collection option has changed."
      );
      works.push(this.collector.save());
    }
    if (this.tagger?.hasOptionsChanged) {
      console.log("Rebuild tags collection because of tag option has changed.");
      works.push(this.tagger?.save());
    }
    if (this.classifier?.hasOptionsChanged) {
      console.log(
        "Rebuild categories collection because of categories option has changed."
      );
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
    // 1. Define variables.
    console.time("Time");
    const enableTag = this.tagger !== undefined;
    const enableCategory = this.classifier !== undefined;

    // 2. Validate and make directory.
    const hasInputDirExisted = await hasExisted(this.inputDir);
    if (!hasInputDirExisted) {
      throw new Error(
        "Make sure that inputDir which storages your markdown files was existed."
      );
    }
    await ensureDirExist(this.outputDir);
    await Promise.all([
      this.generator.preprocess(),
      this.collector.preprocess(),
      enableTag ? this.tagger?.preprocess() : PostsTagger.clean(this.outputDir),
      enableCategory
        ? this.classifier?.preprocess()
        : PostsClassifier.clean(this.outputDir),
    ]);

    // 3. Clear all json files if posts.json hasn't existed.
    const [hasCollectionExist, hasTagsExist, hasCategoriesExist] =
      await Promise.all([
        this.collector.hasExisted(),
        this.tagger?.hasExisted(),
        this.classifier?.hasExisted(),
      ]);

    if (
      !hasCollectionExist ||
      (enableTag && !hasTagsExist) ||
      (enableCategory && !hasCategoriesExist)
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

    // 4. Read and compare files tree (markdown and json), simultaneously, collect changes of files.
    const fileProcessor = new FileProcessor();
    const [markdownTree, jsonTree] = await Promise.all([
      fileProcessor.build(this.inputDir),
      fileProcessor.build(this.generator.outputDir),
    ]);
    const changes = await fileProcessor.compare(markdownTree, jsonTree);

    // 5. Handle all changes.
    if (changes.length > 0) {
      await this.handleChanges(changes);
      await this.forceSave();
    } else {
      console.log("Posts have not changed.");
      await this.handleSave();
    }
    console.timeEnd("Time");
  }
}
