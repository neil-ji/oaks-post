import { join } from "path";
import {
  deleteDir,
  ensureDirExisted,
  hasExisted,
  processRawPostsItem,
  readByStream,
  writeByStream,
} from "./utils.mjs";
import {
  Posts,
  PostsCollection,
  PostsCollectorOptions,
  PostsItem,
  RawPostsItem,
} from "./types/index.mjs";
import { PostsPaginator } from "./PostsPaginator.mjs";

export class PostsCollector {
  public static get dirname() {
    return "posts_collection";
  }

  public static get basename() {
    return "posts";
  }

  public static get filename() {
    return `${this.basename}.json`;
  }

  private data: Posts;
  private path: string;
  private options: PostsCollectorOptions;
  private baseUrl: string;
  private paginator?: PostsPaginator;
  private currentVersion: string;
  private previousVersion: string;

  constructor(
    options: PostsCollectorOptions,
    baseUrl: string,
    version: string
  ) {
    this.data = {
      posts: [],
      postsPages: [],
    };
    this.options = options;
    this.path = join(options.outputDir!, PostsCollector.filename);
    this.baseUrl = baseUrl;
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

  private async paginate() {
    await this.paginator?.clean();
    await this.paginator?.preprocess();
    return (
      this.paginator?.process(this.data.posts, PostsCollector.basename) || []
    );
  }

  public preprocess() {
    return ensureDirExisted(this.outputDir);
  }

  public async save(): Promise<void> {
    const { sort: sortImpl } = this.options;

    // Sort
    if (sortImpl) {
      this.data.posts.sort(sortImpl);
    }

    // Paginate
    this.data.postsPages = await this.paginate();

    // Save
    const collection: PostsCollection = {
      version: this.currentVersion,
      ...this.data,
    };
    const json = JSON.stringify(collection, null, 0);
    await writeByStream(this.path, json);
  }

  public async hasExisted(): Promise<boolean> {
    return hasExisted(this.path);
  }

  public async init(): Promise<void> {
    try {
      const collection: PostsCollection = {
        version: this.currentVersion,
        ...this.data,
      };
      const json = JSON.stringify(collection, null, 0);
      await writeByStream(this.path, json);
    } catch (error) {
      console.error(`Failed create ${PostsCollector.filename}`, error);
    }
  }

  public async load(): Promise<void> {
    try {
      const { posts, postsPages, version }: PostsCollection = JSON.parse(
        await readByStream(this.path)
      );

      this.data = {
        posts,
        postsPages,
      };
      this.previousVersion = version;
    } catch (error) {
      console.error(`Failed load ${PostsCollector.filename}`, error);
    }
  }

  public collect(newItem: RawPostsItem) {
    this.data.posts.push(this.processRawPostsItem(newItem));
  }

  public delete(hash: string) {
    this.data.posts.splice(
      this.data.posts.findIndex((item) => item.hash === hash),
      1
    );
  }

  public modify(newItem: RawPostsItem, oldHash: string) {
    const target = this.data.posts.findIndex((item) => item.hash === oldHash);
    if (target === -1) {
      throw new Error(
        "Failed modify post item.\nDetails: Cannot find specific item in posts.json"
      );
    } else {
      this.data.posts[target] = this.processRawPostsItem(newItem);
    }
  }

  public get outputDir(): string {
    return this.options.outputDir!;
  }

  public async clean() {
    if (await hasExisted(this.outputDir)) {
      await deleteDir(this.outputDir);
    }
  }

  public get hasOptionsChanged() {
    return this.currentVersion !== this.previousVersion;
  }
}
