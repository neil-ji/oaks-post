import { join } from "path";
import {
  PostItem,
  RawPostItem,
  PostsExcerptRule,
  PostsClassifierOptions,
  PostsCategoriesMap,
  PostFrontMatter,
  PostCategoryItem,
} from "./types/index.mjs";
import {
  deleteDir,
  ensureDirExisted,
  getCustomExcerpt,
  getExcerpt,
  getRelativePath,
  getUrlPath,
  hasExisted,
  readByStream,
  writeByStream,
} from "./utils.mjs";
import { PostsPaginator } from "./PostsPaginator.mjs";
import { PostsCollection } from "./PostsCollection.mjs";

export class PostsClassifier {
  public static get basename() {
    return "categories";
  }

  public static get filename() {
    return `${this.basename}.json`;
  }

  private options: PostsClassifierOptions;
  private baseUrl: string;
  private categoriesMap: PostsCategoriesMap;
  private path: string;
  private paginator?: PostsPaginator;

  constructor(options: PostsClassifierOptions, baseUrl: string) {
    this.options = options;
    this.path = join(options.outputDir!, PostsClassifier.filename);
    this.baseUrl = baseUrl;
    this.categoriesMap = new Map();

    if (options.itemsPerPage) {
      this.paginator = new PostsPaginator({
        itemsPerPage: options.itemsPerPage,
        outputDir: this.outputDir,
        baseUrl: this.baseUrl,
      });
    }
  }

  private processRawPostItem({
    path,
    hash,
    frontMatter,
    content,
  }: RawPostItem): PostItem {
    const { excerpt } = this.options;
    const tag = excerpt?.tag || "<!--more-->";
    const lines = excerpt?.lines || 5;
    return {
      url: getUrlPath(join(this.baseUrl, getRelativePath(path))),
      hash,
      frontMatter,
      excerpt:
        excerpt?.rule === PostsExcerptRule.CustomTag
          ? getCustomExcerpt(content, tag)
          : getExcerpt(content, lines),
    };
  }

  private convertArrayToMap(
    categories: PostCategoryItem[]
  ): PostsCategoriesMap {
    const map = new Map();
    categories.forEach(({ category, posts, subcategories }) => {
      map.set(category, {
        posts,
        subcategories: this.convertArrayToMap(subcategories),
      });
    });
    return map;
  }

  private convertMapToArray(map: PostsCategoriesMap): PostCategoryItem[] {
    const categories: PostCategoryItem[] = [];
    map.forEach(({ posts, subcategories }, category) => {
      categories.push({
        category,
        posts,
        subcategories: this.convertMapToArray(subcategories),
      });
    });
    return categories;
  }

  private processFiles(
    categories: PostCategoryItem[]
  ): Promise<PostCategoryItem[]> {
    const works = categories.map(async ({ category, posts, subcategories }) => {
      const postsPages = await this.paginator?.process(
        posts,
        `${PostsCollection.basename}_${category}`
      );
      return {
        category,
        posts,
        postsPages,
        subcategories: await this.processFiles(subcategories),
      };
    });
    return Promise.all(works);
  }

  public collect(rawItem: RawPostItem) {
    const item = this.processRawPostItem(rawItem);
    const categories: string[] = item.frontMatter?.[this.options.propName!];
    if (!categories) return;

    let p = this.categoriesMap;
    categories.forEach((value, index) => {
      if (!p.has(value)) {
        const posts = index === categories.length - 1 ? [item] : [];
        p.set(value, {
          posts,
          subcategories: new Map(),
        });
      }
      p = p.get(value)!.subcategories;
    });
  }

  public delete(hash: string, frontMatter: PostFrontMatter) {
    const categories: string[] = frontMatter?.[this.options.propName!];
    if (!categories) return;

    let p = this.categoriesMap;
    categories.forEach((value, index) => {
      if (!p || !p.has(value)) return;

      if (index === categories.length - 1) {
        const posts = p.get(value)?.posts;
        if (!posts) return;

        const target = posts.findIndex((item) => item.hash === hash);
        if (target === -1) return;

        posts.splice(target, 1);
      }
      p = p.get(value)!.subcategories;
    });
  }

  public modify(rawItem: RawPostItem, hash: string) {
    this.delete(hash, rawItem.frontMatter);
    this.collect(rawItem);
  }

  public async preprocess() {
    return ensureDirExisted(this.outputDir);
  }

  public async save() {
    try {
      // Prepare to paginate
      await this.paginator?.clean();
      await this.paginator?.preprocess();

      // Convert data and paginate.
      const categories = this.convertMapToArray(this.categoriesMap);
      const data = await this.processFiles(categories);
      const json = JSON.stringify(data, null, 0);
      await writeByStream(this.path, json);
    } catch (error) {
      throw console.error("Failed analyze tags of posts.", error);
    }
  }

  public async clean() {
    if (await hasExisted(this.outputDir)) {
      await deleteDir(this.outputDir);
    }
  }

  public get outputDir() {
    return this.options.outputDir!;
  }

  public async init(): Promise<void> {
    try {
      const defaultData: PostCategoryItem[] = [];
      await writeByStream(this.path, JSON.stringify(defaultData, null, 0));
    } catch (error) {
      console.error(`Failed create ${PostsClassifier.filename}`, error);
    }
  }

  public async hasExisted(): Promise<boolean> {
    return hasExisted(this.path);
  }

  public async load(): Promise<void> {
    try {
      const categories: PostCategoryItem[] = JSON.parse(
        await readByStream(this.path)
      );
      this.categoriesMap = this.convertArrayToMap(categories);
    } catch (error) {
      console.error(`Failed load ${PostsClassifier.filename}`, error);
    }
  }
}
