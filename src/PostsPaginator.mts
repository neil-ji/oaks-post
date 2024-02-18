import { createWriteStream } from "fs";
import { readdir, rm } from "fs/promises";
import { join } from "path";
import { pipeline } from "stream/promises";
import { PostItem, PostsCollection } from "./PostsCollection.mjs";
import { ensureFileExist, getRelativePath, getUrlPath } from "./utils.mjs";

export interface PostsPaginatorOptions {
  itemsPerPage?: number;
  baseUrl?: string;
  outputDir: string;
}

export interface PostsPage {
  pages: number;
  current: number;
  posts: PostItem[];
  prev?: string;
  next?: string;
}

export class PostsPaginator {
  public static async clear(dir: string) {
    try {
      const files = await readdir(dir);
      const postPages = files.filter((file) => {
        return file.match(/^posts_\d+\.json$/);
      });
      await Promise.all(postPages.map((file) => rm(join(dir, file))));
    } catch (error) {
      throw new Error("Failed clear remained posts pagination file.");
    }
  }
  private itemsPerPage: number;
  private outputDir: string;
  private baseUrl: string;

  constructor({ itemsPerPage, outputDir, baseUrl }: PostsPaginatorOptions) {
    this.itemsPerPage = itemsPerPage || 10;
    this.outputDir = outputDir;
    this.baseUrl = baseUrl || "";
  }

  private processFile = async (data: PostsPage) => {
    const filePath = join(
      this.outputDir,
      `${PostsCollection.basename}_${data.current}.json`
    );
    await ensureFileExist(filePath);
    const writeStream = createWriteStream(filePath, "utf-8");
    return pipeline(JSON.stringify(data, null, 0), writeStream);
  };

  public paginate = async (posts: PostItem[]) => {
    try {
      const postGroups = [];

      for (let i = 0; i < posts.length; i += this.itemsPerPage) {
        postGroups.push(posts.slice(i, i + this.itemsPerPage));
      }

      const postPages: PostsPage[] = postGroups.map((items, index) => {
        const current = index + 1;
        const directorySegment = getRelativePath(this.outputDir);
        return {
          pages: postGroups.length,
          current,
          posts: items,
          prev:
            current > 1
              ? getUrlPath(
                  join(
                    this.baseUrl,
                    directorySegment,
                    `${PostsCollection.basename}_${current - 1}.json`
                  )
                )
              : undefined,
          next:
            current < postGroups.length
              ? getUrlPath(
                  join(
                    this.baseUrl,
                    directorySegment,
                    `${PostsCollection.basename}_${current + 1}.json`
                  )
                )
              : undefined,
        };
      });

      await Promise.all(postPages.map(this.processFile));
    } catch (error: any) {
      throw new Error(`Failed paginate.\nDetails:${error.message}`);
    }
  };
}
