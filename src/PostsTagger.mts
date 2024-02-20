import { join } from "path";
import {
  PostItem,
  PostsTaggerOptions,
  PostTagItem,
  RawPostItem,
  PostsExcerptRule,
} from "./types/index.mjs";
import {
  deleteDir,
  getCustomExcerpt,
  getExcerpt,
  getRelativePath,
  getUrlPath,
  readByStream,
  writeByStream,
} from "./utils.mjs";
import { PostsPaginator } from "./PostsPaginator.mjs";
import { PostsCollection } from "./PostsCollection.mjs";
import { access, writeFile } from "fs/promises";

export class PostsTagger {
  public static get basename() {
    return "tags";
  }

  public static get filename() {
    return `${this.basename}.json`;
  }

  private options: PostsTaggerOptions;
  private baseUrl: string;
  private tagsMap: Map<string, PostItem[]>;
  private path: string;

  constructor(options: PostsTaggerOptions, baseUrl: string) {
    this.options = options;
    this.path = join(options.outputDir!, PostsTagger.filename);
    this.baseUrl = baseUrl;
    this.tagsMap = new Map();
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

  public collect(rawItem: RawPostItem) {
    const newItem = this.processRawPostItem(rawItem);
    const tags: string[] | undefined =
      newItem.frontMatter?.[this.options.propName!];
    if (!tags) return;

    tags.forEach((tag) => {
      if (this.tagsMap.has(tag)) {
        const posts = this.tagsMap.get(tag)!;
        posts.push(newItem);
      } else {
        this.tagsMap.set(tag, [newItem]);
      }
    });
  }

  public delete(hash?: string) {
    const tags: string[] = [];
    for (const posts of this.tagsMap.values()) {
      const target = posts.find((item) => item.hash === hash);
      const targetTags = target?.frontMatter?.[this.options.propName!];
      if (targetTags) {
        tags.push(...targetTags);
      }
    }

    const deletedTags: string[] = [];
    tags.forEach((tag) => {
      const posts = this.tagsMap.get(tag);
      if (!posts) return;

      const target = posts.findIndex((item) => item.hash === hash);
      if (target === -1) return;

      posts.splice(target, 1);

      // Collect tag which doesn't map any posts, and delete them later.
      if (posts.length === 0) {
        deletedTags.push(tag);
      }
    });

    deletedTags.forEach((tag) => {
      this.tagsMap.delete(tag);
    });
  }

  public modify(rawItem: RawPostItem, hash?: string) {
    this.delete(hash);
    this.collect(rawItem);
  }

  private async paginate(posts: PostItem[], tag: string) {
    const { itemsPerPage } = this.options;
    if (itemsPerPage) {
      const paginator = new PostsPaginator({
        itemsPerPage,
        outputDir: this.options.outputDir!,
        baseUrl: this.baseUrl,
        prefix: `${PostsCollection.basename}_${tag}`,
      });
      // await paginator.clean();
      return paginator.start(posts);
    }
    return [];
  }

  public async save() {
    try {
      // Convert data
      const rawTags = this.tagsMap.entries();
      const tags: PostTagItem[] = [];
      for (const [tag, posts] of rawTags) {
        tags.push({
          tag,
          posts,
          postsPages: await this.paginate(posts, tag),
        });
      }
      const tagsJson = JSON.stringify(tags, null, 0);

      // Save
      await writeByStream(this.path, tagsJson);
    } catch (error) {
      throw console.error("Failed analyze tags of posts.", error);
    }
  }

  public async clean() {
    await deleteDir(this.outputDir);
  }

  public get outputDir() {
    return this.options.outputDir!;
  }

  public async init(): Promise<void> {
    try {
      const defaultData: PostTagItem[] = [];
      await writeFile(this.path, JSON.stringify(defaultData, null, 0));
    } catch (error) {
      console.error(`Failed create ${PostsTagger.filename}`, error);
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
      const tags: PostTagItem[] = JSON.parse(await readByStream(this.path));
      tags.forEach((item) => {
        this.tagsMap.set(item.tag, item.posts);
      });
    } catch (error) {
      console.error(`Failed load ${PostsTagger.filename}`, error);
    }
  }
}
