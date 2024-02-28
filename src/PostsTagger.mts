import { join } from "path";
import {
  PostsItem,
  PostsTaggerOptions,
  PostTagsItem,
  RawPostsItem,
  PostFrontMatter,
  PostTagsCollection,
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

export class PostsTagger {
  public static get basename() {
    return "tags";
  }

  public static get filename() {
    return `${this.basename}.json`;
  }

  private options: PostsTaggerOptions;
  private baseUrl: string;
  private tagsMap: Map<string, PostsItem[]>;
  private path: string;
  private paginator?: PostsPaginator;
  private currentVersion: string;
  private previousVersion: string;

  constructor(options: PostsTaggerOptions, baseUrl: string, version: string) {
    this.options = options;
    this.path = join(options.outputDir!, PostsTagger.filename);
    this.baseUrl = baseUrl;
    this.tagsMap = new Map();
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

  public collect(rawItem: RawPostsItem) {
    const newItem = this.processRawPostsItem(rawItem);
    const propValue: string | string[] | undefined =
      newItem.frontMatter?.[this.options.propName!];

    if (!propValue) return;

    const tags = typeof propValue === "string" ? [propValue] : propValue;

    tags.forEach((tag) => {
      if (this.tagsMap.has(tag)) {
        const posts = this.tagsMap.get(tag)!;
        posts.push(newItem);
      } else {
        this.tagsMap.set(tag, [newItem]);
      }
    });
  }

  public delete(hash: string, frontMatter: PostFrontMatter) {
    const propValue: string | string[] | undefined =
      frontMatter?.[this.options.propName!];

    if (!propValue) return;

    const tags = typeof propValue === "string" ? [propValue] : propValue;

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

  public modify(newItem: RawPostsItem, oldItem: RawPostsItem) {
    this.delete(oldItem.hash, oldItem.frontMatter);
    this.collect(newItem);
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
      const tagsEntry = Array.from(this.tagsMap.entries());
      const works = tagsEntry.map(async ([tag, posts]) => {
        // Sort
        const sortImpl = this.options.sort;
        if (sortImpl) {
          posts.sort(sortImpl);
        }
        // Paginate
        const prefix = `${PostsCollector.basename}_${tag}`;
        const postsPages = await this.paginator?.process(posts, prefix);
        return {
          tag,
          posts,
          postsPages,
        };
      });
      const tags: PostTagsItem[] = await Promise.all(works);
      const data: PostTagsCollection = {
        version: this.currentVersion,
        tags,
      };
      const json = JSON.stringify(data, null, 0);

      // Save
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
      const defaultData: PostTagsCollection = {
        version: this.currentVersion,
        tags: [],
      };
      await writeByStream(this.path, JSON.stringify(defaultData, null, 0));
    } catch (error) {
      console.error(`Failed create ${PostsTagger.filename}`, error);
    }
  }

  public async hasExisted(): Promise<boolean> {
    return hasExisted(this.path);
  }

  public async load(): Promise<void> {
    try {
      const { tags, version }: PostTagsCollection = JSON.parse(
        await readByStream(this.path)
      );
      tags.forEach((item) => {
        this.tagsMap.set(item.tag, item.posts);
      });
      this.previousVersion = version;
    } catch (error) {
      console.error(`Failed load ${PostsTagger.filename}`, error);
    }
  }

  public get hasOptionsChanged() {
    return this.currentVersion !== this.previousVersion;
  }
}
