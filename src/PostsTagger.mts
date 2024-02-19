import { readdir, rm } from "fs/promises";
import { join } from "path";
import { PostItem, PostsTaggerOptions, PostFrontMatter } from "./types";
import { deleteDir } from "./utils.mjs";

export class PostsTagger {
  public static get basename() {
    return "tags";
  }
  public static async clean(dir: string) {
    // try {
    //   const files = await readdir(dir);
    //   const postPages = files.filter((file) => {
    //     return file.match(/^posts_tag\d+\.json$/);
    //   });
    //   await Promise.all(postPages.map((file) => rm(join(dir, file))));
    // } catch (error) {
    //   throw new Error("Failed clear remained posts pagination file.");
    // }
  }

  private options: PostsTaggerOptions;
  private baseUrl: string;
  private tags: Map<string, PostItem[]>;
  private path: string;

  constructor(options: PostsTaggerOptions, baseUrl: string) {
    this.options = options;
    this.path = join(options.outputDir!, PostsTagger.basename);
    this.baseUrl = baseUrl;
    this.tags = new Map();
  }

  private collect(newItem: PostItem) {
    const tags: string[] | undefined =
      newItem.frontMatter?.[this.options.propName!];
    if (!tags) return;

    tags.forEach((tag) => {
      if (this.tags.has(tag)) {
        const posts = this.tags.get(tag)!;
        posts.push(newItem);
      } else {
        this.tags.set(tag, [newItem]);
      }
    });
  }

  private save() {
    try {
      // 数据转换
      // 判断目录存在
      // 持久化
      // 分页
    } catch (error) {
      console.error("Failed analyze tags of posts.", error);
    }
  }

  public start = async (posts: PostItem[]) => {
    posts.forEach(this.collect);
    await this.save();
  };

  public async clean() {
    await deleteDir(this.options.outputDir!);
  }
}
