import { readdir, rm } from "fs/promises";
import { join } from "path";
import { PostItem, PostsTaggerOptions, PostFrontMatter } from "./types";

export class PostsTagger {
  public static get dirname() {
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

  private outputDir: string;
  private baseUrl: string;
  private propName: string;
  private tags: Map<string, PostItem[]>;

  constructor({ outputDir, baseUrl, propName = "tag" }: PostsTaggerOptions) {
    this.outputDir = join(outputDir, PostsTagger.dirname);
    this.baseUrl = baseUrl;
    this.tags = new Map();
    this.propName = propName;
  }

  private getTags(frontMatter: PostFrontMatter): undefined | string[] {
    return;
  }

  public collect(newItem: PostItem) {
    const tags: string[] | undefined = newItem.frontMatter?.[this.propName];
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

  public clean() {
    this.tags.clear();
  }

  public save() {
    try {
    } catch (error) {
      console.error("Failed analyze tags of posts.", error);
    }
  }
}
