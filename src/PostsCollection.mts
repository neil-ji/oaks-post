import { access, writeFile } from "fs/promises";
import { join } from "path";
import {
  getCustomExcerpt,
  getExcerpt,
  getRelativePath,
  getUrlPath,
  readByStream,
  writeByStream,
} from "./utils.mjs";
import { RawPostItem } from "./PostsGenerator.mjs";

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

  constructor(outputDir: string, options: PostsCollectionOptions) {
    this.data = {
      buildTime: new Date(),
      posts: [],
    };
    this.path = join(outputDir, PostsCollection.filename);
    this.options = options;
  }

  private processRawPostItem({
    path,
    hash,
    frontMatter,
    content,
  }: RawPostItem): PostItem {
    const { excerpt, baseUrl } = this.options;
    const tag = excerpt?.tag || "<!--more-->";
    const lines = excerpt?.lines || 5;
    return {
      url: getUrlPath(join(baseUrl || "", getRelativePath(path))),
      hash,
      frontMatter,
      excerpt:
        excerpt?.rule === PostsExcerptRule.CustomTag
          ? getCustomExcerpt(content, tag)
          : getExcerpt(content, lines),
    };
  }

  public sort() {
    const impl = this.options?.sort;
    if (impl) {
      this.data.posts.sort(impl);
    }
  }

  public async save(): Promise<void> {
    await writeByStream(this.path, JSON.stringify(this.data, null, 0));
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

  public modify(rawPostItem: RawPostItem, hash?: string) {
    const postItem = this.processRawPostItem(rawPostItem);
    const target = this.data.posts.findIndex((item) => item.hash === hash);
    if (target === -1) {
      throw new Error("Cannot find specific item in posts.json");
    } else {
      this.data.posts[target] = { ...postItem };
    }
  }

  public get posts(): PostItem[] {
    return JSON.parse(JSON.stringify(this.data.posts));
  }
}

export interface PostFrontMatter {
  [key: string]: any;
}

export interface PostItem {
  hash?: string;
  url?: string;
  frontMatter?: PostFrontMatter;
  excerpt?: string;
}

export interface Posts {
  buildTime: Date;
  posts: PostItem[];
}

export enum PostsExcerptRule {
  ByLines = 1,
  CustomTag = 2,
}

export interface PostsCollectionOptions {
  baseUrl?: string;
  sort?: (a: PostItem, b: PostItem) => number;
  excerpt?: {
    rule: PostsExcerptRule;
    lines?: number;
    tag?: string;
  };
}
