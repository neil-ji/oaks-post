import { createWriteStream } from "fs";
import { readdir, rm } from "fs/promises";
import { join } from "path";
import { pipeline } from "stream/promises";
import { ensureFileExist, getRelativePath, getUrlPath } from "./utils.mjs";
import { PostItem, PostsPage, PostsPaginatorOptions } from "./types/index.mjs";

export class PostsPaginator {
  private itemsPerPage: number;
  private outputDir: string;
  private baseUrl: string;
  private prefix: string;

  constructor({
    itemsPerPage,
    outputDir,
    baseUrl,
    prefix,
  }: PostsPaginatorOptions) {
    this.itemsPerPage = itemsPerPage || 10;
    this.outputDir = outputDir;
    this.baseUrl = baseUrl;
    this.prefix = prefix;
  }

  private generateUrl(pageIndex: number) {
    const directorySegment = getRelativePath(this.outputDir);
    return getUrlPath(
      join(this.baseUrl, directorySegment, `${this.prefix}_${pageIndex}.json`)
    );
  }

  private generatePrevLink(current: number) {
    if (current > 1) return this.generateUrl(current - 1);
  }

  private generateNextLink(current: number, ceiling: number) {
    if (current < ceiling) return this.generateUrl(current + 1);
  }

  private generateFile = async (data: PostsPage) => {
    const filePath = join(
      this.outputDir,
      `${this.prefix}_${data.current}.json`
    );
    await ensureFileExist(filePath);
    const writeStream = createWriteStream(filePath, "utf-8");
    await pipeline(JSON.stringify(data, null, 0), writeStream);

    return data.url;
  };

  public async clean() {
    try {
      const files = await readdir(this.outputDir);
      const filesRegExp = new RegExp(`^${this.prefix}_\d+\.json$`);
      const postPages = files.filter((file) => {
        return file.match(filesRegExp);
      });
      await Promise.all(
        postPages.map((file) => rm(join(this.outputDir, file)))
      );
    } catch (error) {
      throw new Error("Failed clear remained posts pagination file.");
    }
  }

  public start = async (posts: PostItem[]) => {
    try {
      const postGroups = [];

      for (let i = 0; i < posts.length; i += this.itemsPerPage) {
        postGroups.push(posts.slice(i, i + this.itemsPerPage));
      }

      const postPages: PostsPage[] = postGroups.map((posts, index) => {
        const current = index + 1;
        return {
          pages: postGroups.length,
          current,
          posts,
          url: this.generateUrl(current),
          prev: this.generatePrevLink(current),
          next: this.generateNextLink(current, postGroups.length),
        };
      });

      return Promise.all(postPages.map(this.generateFile));
    } catch (error: any) {
      throw new Error(`Failed paginate.\nDetails:${error.message}`);
    }
  };
}
