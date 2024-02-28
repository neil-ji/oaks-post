import { join } from "path";
import {
  PostsItem,
  RawPostsItem,
  PostsClassifierOptions,
  PostsCategoriesMap,
  PostFrontMatter,
  PostCategoriesItem,
  PostCategoriesCollection,
} from "./types/index.mjs";
import {
  deleteDir,
  ensureDirExisted,
  hasExisted,
  processRawPostsItem,
  readByStream,
  writeByStream,
} from "./utils.mjs";
import { PostsPaginator } from "./PostsPaginator.mjs";
import { PostsCollector } from "./PostsCollector.mjs";

export class PostsClassifier {
  public static get basename() {
    return "categories";
  }
  public static get dirname() {
    return "categories_collection";
  }

  public static get filename() {
    return `${this.basename}.json`;
  }

  private options: PostsClassifierOptions;
  private baseUrl: string;
  private categoriesMap: PostsCategoriesMap;
  private path: string;
  private paginator?: PostsPaginator;
  private currentVersion: string;
  private previousVersion: string;

  constructor(
    options: PostsClassifierOptions,
    baseUrl: string,
    version: string
  ) {
    this.options = options;
    this.path = join(options.outputDir!, PostsClassifier.filename);
    this.baseUrl = baseUrl;
    this.categoriesMap = new Map();
    this.currentVersion = version;
    this.previousVersion = "";

    const { itemsPerPage } = this.options;
    if (itemsPerPage) {
      this.paginator = new PostsPaginator({
        itemsPerPage,
        outputDir: this.outputDir,
        baseUrl: this.baseUrl,
      });
    }
  }

  private processRawPostsItem(rawItem: RawPostsItem): PostsItem {
    return processRawPostsItem(this.baseUrl, rawItem, this.options.excerpt);
  }

  private convertArrayToMap(
    categories: PostCategoriesItem[]
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

  private convertMapToArray(map: PostsCategoriesMap): PostCategoriesItem[] {
    const categories: PostCategoriesItem[] = [];
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
    categories: PostCategoriesItem[],
    prefix: string
  ): Promise<PostCategoriesItem[]> {
    const works = categories.map(async ({ category, posts, subcategories }) => {
      // Paginate
      const newPrefix = `${prefix}_${category}`;
      const postsPages = await this.paginator?.process(posts, newPrefix);

      // Sort
      const sortImpl = this.options.sort;
      if (sortImpl) {
        posts.sort(sortImpl);
      }

      return {
        category,
        posts,
        postsPages,
        subcategories: await this.processFiles(subcategories, newPrefix),
      };
    });
    return Promise.all(works);
  }

  public collect(rawItem: RawPostsItem) {
    const newItem = this.processRawPostsItem(rawItem);
    const propValue: string | string[] | undefined =
      newItem.frontMatter?.[this.options.propName!];

    if (!propValue) return;

    const categories = typeof propValue === "string" ? [propValue] : propValue;

    let p = this.categoriesMap;
    categories.forEach((value, index) => {
      if (!p.has(value)) {
        p.set(value, {
          posts: [],
          subcategories: new Map(),
        });
      }

      if (index === categories.length - 1) {
        p.get(value)?.posts.push(newItem);
      }

      p = p.get(value)!.subcategories;
    });
  }

  public delete(hash: string, frontMatter: PostFrontMatter) {
    const propValue: string | string[] | undefined =
      frontMatter?.[this.options.propName!];

    if (!propValue) return;

    const categories = typeof propValue === "string" ? [propValue] : propValue;

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

  public modify(newItem: RawPostsItem, oldItem: RawPostsItem) {
    this.delete(oldItem.hash, oldItem.frontMatter);
    this.collect(newItem);
  }

  public preprocess() {
    return ensureDirExisted(this.outputDir);
  }

  public async save() {
    try {
      // Prepare to paginate
      await this.paginator?.clean();
      await this.paginator?.preprocess();

      // Convert data and paginate.
      const rawCategories = this.convertMapToArray(this.categoriesMap);
      const categories = await this.processFiles(
        rawCategories,
        PostsCollector.basename
      );
      const data: PostCategoriesCollection = {
        version: this.currentVersion,
        categories,
      };

      // Save
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
      const defaultData: PostCategoriesCollection = {
        version: this.currentVersion,
        categories: [],
      };
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
      const { categories, version }: PostCategoriesCollection = JSON.parse(
        await readByStream(this.path)
      );
      this.categoriesMap = this.convertArrayToMap(categories);
      this.previousVersion = version;
    } catch (error) {
      console.error(`Failed load ${PostsClassifier.filename}`, error);
    }
  }

  public get hasOptionsChanged() {
    return this.currentVersion !== this.previousVersion;
  }
}
