import { join } from "path";
import {
  PostItem,
  PostsTaggerOptions,
  PostFrontMatter,
  PostTagItem,
} from "./types/index.mjs";
import { deleteDir, writeByStream } from "./utils.mjs";
import { PostsPaginator } from "./PostsPaginator.mjs";
import { PostsCollection } from "./PostsCollection.mjs";

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

  private collect(newItem: PostItem) {
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

  private async paginate(posts: PostItem[], tag: string) {
    const { itemsPerPage } = this.options;
    if (itemsPerPage) {
      const paginator = new PostsPaginator({
        itemsPerPage,
        outputDir: this.options.outputDir!,
        baseUrl: this.baseUrl,
        prefix: `${PostsCollection.basename}_${tag}`,
      });
      await paginator.clean();
      return paginator.start(posts);
    }
    return [];
  }

  private async save() {
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
      console.error("Failed analyze tags of posts.", error);
    }
  }

  public start = async (posts: PostItem[]) => {
    posts.forEach((post) => this.collect(post));
    await this.save();
  };

  public async clean() {
    await deleteDir(this.options.outputDir!);
  }

  public get outputDir() {
    return this.options.outputDir!;
  }
}
