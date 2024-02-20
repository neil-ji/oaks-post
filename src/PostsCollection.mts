import { access, writeFile } from "fs/promises";
import { join } from "path";
import {
  deleteDir,
  getCustomExcerpt,
  getExcerpt,
  getRelativePath,
  getUrlPath,
  readByStream,
  writeByStream,
} from "./utils.mjs";
import {
  Posts,
  PostsCollectionOptions,
  PostItem,
  PostsExcerptRule,
  RawPostItem,
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

  constructor(options: PostsCollectionOptions, baseUrl: string) {
    this.data = {
      posts: [],
      postsPages: [],
    };
    this.options = options;
    this.path = join(options.outputDir!, PostsCollection.filename);
    this.baseUrl = baseUrl;
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

  private async paginate() {
    const { itemsPerPage } = this.options;
    if (itemsPerPage) {
      const paginator = new PostsPaginator({
        itemsPerPage,
        outputDir: this.options.outputDir!,
        baseUrl: this.baseUrl,
        prefix: PostsCollection.basename,
      });
      await paginator.clean();
      return paginator.start(this.posts);
    }
    return [];
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
      await writeFile(
        this.path,
        JSON.stringify(
          {
            buildTime: new Date(),
            posts: [],
          },
          null,
          0
        )
      );
    } catch (error) {
      console.error("Failed create posts.json file.", error);
    }
  }

  public async hasExisted(): Promise<boolean> {
    try {
      await access(this.path);
    } catch {
      return false;
    }
    return true;
  }

  public async load(): Promise<void> {
    try {
      this.data = JSON.parse(await readByStream(this.path));
    } catch (error) {
      console.error(`Failed load ${PostsCollection.filename}`, error);
    }
  }

  public collect(newItem: RawPostItem) {
    this.data.posts.push(this.processRawPostItem(newItem));
  }

  public delete(hash: string) {
    this.data.posts.splice(
      this.data.posts.findIndex((item) => item.hash === hash),
      1
    );
  }

  public modify(newItem: RawPostItem, hash?: string) {
    const target = this.data.posts.findIndex((item) => item.hash === hash);
    if (target === -1) {
      throw new Error(
        "Failed modify post item.\nDetails: Cannot find specific item in posts.json"
      );
    } else {
      this.data.posts[target] = this.processRawPostItem(newItem);
    }
  }

  public get posts(): PostItem[] {
    return JSON.parse(JSON.stringify(this.data.posts));
  }

  public get outputDir(): string {
    return this.options.outputDir!;
  }

  public async clean() {
    await deleteDir(this.options.outputDir!);
  }
}
