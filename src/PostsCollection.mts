import { join } from "path";
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
import {
  Posts,
  PostsCollectionOptions,
  PostsItem,
  PostsExcerptRule,
  RawPostsItem,
} from "./types/index.mjs";
import { PostsPaginator } from "./PostsPaginator.mjs";

export class PostsCollection {
  public static get basename() {
    return "posts";
  }

  public static get filename() {
    return `${this.basename}.json`;
  }

  private data: Posts;
  private path: string;
  private options: PostsCollectionOptions;
  private baseUrl: string;
  private paginator?: PostsPaginator;

  constructor(options: PostsCollectionOptions, baseUrl: string) {
    this.data = {
      posts: [],
      postsPages: [],
    };
    this.options = options;
    this.path = join(options.outputDir!, PostsCollection.filename);
    this.baseUrl = baseUrl;

    const { itemsPerPage } = this.options;
    if (itemsPerPage) {
      this.paginator = new PostsPaginator({
        itemsPerPage,
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
  }: RawPostsItem): PostsItem {
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

  private async paginate() {
    await this.paginator?.clean();
    await this.paginator?.preprocess();
    return this.paginator?.process(this.posts, PostsCollection.basename) || [];
  }

  public async preprocess() {
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
    const postsJson = JSON.stringify(this.data, null, 0);
    await writeByStream(this.path, postsJson);
  }

  public async init(): Promise<void> {
    try {
      const defaultData: Posts = {
        posts: [],
        postsPages: [],
      };
      await writeByStream(this.path, JSON.stringify(defaultData, null, 0));
    } catch (error) {
      console.error(`Failed create ${PostsCollection.filename}`, error);
    }
  }

  public async hasExisted(): Promise<boolean> {
    return hasExisted(this.path);
  }

  public async load(): Promise<void> {
    try {
      this.data = JSON.parse(await readByStream(this.path));
    } catch (error) {
      console.error(`Failed load ${PostsCollection.filename}`, error);
    }
  }

  public collect(newItem: RawPostsItem) {
    this.data.posts.push(this.processRawPostItem(newItem));
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
      this.data.posts[target] = this.processRawPostItem(newItem);
    }
  }

  public get posts(): PostsItem[] {
    return JSON.parse(JSON.stringify(this.data.posts));
  }

  public get outputDir(): string {
    return this.options.outputDir!;
  }

  public async clean() {
    if (await hasExisted(this.outputDir)) {
      await deleteDir(this.outputDir);
    }
  }
}
