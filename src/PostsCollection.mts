import { access, writeFile } from "fs/promises";
import { join } from "path";
import { readByStream, writeByStream } from "./utils.mjs";

export class PostsCollection {
  public static get basename() {
    return "posts";
  }

  public static get filename() {
    return `${this.basename}.json`;
  }

  private data: Posts;
  private descending: boolean;
  private path: string;

  constructor(outputDir: string, descending = false) {
    this.data = {
      buildTime: new Date(),
      posts: [],
    };
    this.descending = descending;
    this.path = join(outputDir, PostsCollection.filename);
  }

  private sort() {
    this.data.posts.sort((a, b) => {
      const dateA = a?.frontMatter?.date
        ? new Date(a?.frontMatter?.date)
        : Date.now();
      const dateB = b?.frontMatter?.date
        ? new Date(b?.frontMatter?.date)
        : Date.now();
      const sortBy = dateA.valueOf() > dateB.valueOf();
      return !this.descending && sortBy ? 1 : -1;
    });
  }

  public async save(): Promise<void> {
    await writeByStream(this.path, JSON.stringify(this.data));
  }

  public async init(): Promise<void> {
    try {
      await writeFile(
        this.path,
        JSON.stringify({
          buildTime: new Date(),
          posts: [],
        })
      );
    } catch (error) {
      throw new Error("Failed create posts.json file.");
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
    } catch {
      throw new Error(`Failed load ${PostsCollection.filename}`);
    }
  }

  public collect(newItem: PostItem) {
    this.data.posts.push(newItem);
  }

  public delete(hash: string) {
    this.data.posts.splice(
      this.data.posts.findIndex((item) => item.hash === hash),
      1
    );
  }

  public modify(newItem: PostItem, hash?: string) {
    const target = this.data.posts.findIndex((item) => item.hash === hash);
    if (target === -1) {
      this.collect(newItem);
    } else {
      this.data.posts[target] = { ...newItem };
    }
  }

  public get posts() {
    return [...this.data.posts];
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
