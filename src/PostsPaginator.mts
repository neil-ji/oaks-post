import { join } from "path";
import {
  deleteDir,
  ensureDirExisted,
  getRelativePath,
  getUrlPath,
  hasExisted,
  writeByStream,
} from "./utils.mjs";
import { PostsItem, PostsPage, PostsPaginatorOptions } from "./types/index.mjs";

export class PostsPaginator {
  public static get basename() {
    return "pages";
  }

  private itemsPerPage: number;
  private outputDir: string;
  private baseUrl: string;

  constructor({ itemsPerPage, outputDir, baseUrl }: PostsPaginatorOptions) {
    this.itemsPerPage = itemsPerPage || 10;
    this.outputDir = join(outputDir, PostsPaginator.basename);
    this.baseUrl = baseUrl;
  }

  private generateUrl(pageIndex: number, prefix: string) {
    const directorySegment = getRelativePath(this.outputDir);
    return getUrlPath(
      join(this.baseUrl, directorySegment, `${prefix}_${pageIndex}.json`)
    );
  }

  private generatePrevLink(current: number, prefix: string) {
    if (current > 1) return this.generateUrl(current - 1, prefix);
  }

  private generateNextLink(current: number, ceiling: number, prefix: string) {
    if (current < ceiling) return this.generateUrl(current + 1, prefix);
  }

  private generateFile = async (data: PostsPage, prefix: string) => {
    const filePath = join(this.outputDir, `${prefix}_${data.current}.json`);

    await writeByStream(filePath, JSON.stringify(data, null, 0));

    return data.url;
  };

  public async clean() {
    if (await hasExisted(this.outputDir)) {
      await deleteDir(this.outputDir);
    }
  }

  public async preprocess() {
    // Check if outputDir is existed.
    await ensureDirExisted(this.outputDir);
  }

  public process = async (posts: PostsItem[], prefix: string) => {
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
          url: this.generateUrl(current, prefix),
          prev: this.generatePrevLink(current, prefix),
          next: this.generateNextLink(current, postGroups.length, prefix),
        };
      });

      const works = postPages.map((item) => this.generateFile(item, prefix));
      return Promise.all(works);
    } catch (error: any) {
      throw new Error(`Failed paginate.\nDetails:${error.message}`);
    }
  };
}
