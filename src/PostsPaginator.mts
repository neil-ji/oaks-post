import { createWriteStream } from "fs";
import { join } from "path";
import { pipeline } from "stream/promises";
import { PostItem, Posts, PostsCollection } from "./PostsCollection.mjs";
import {
  ensureFileExist,
  getFileContent,
  getRelativePath,
  getUrlPath,
} from "./utils.mjs";

export interface PostsPaginatorOptions {
  maxItems: number;
  baseUrl: string;
  jsonDirectory: string;
}

export interface PostsPage {
  current: number;
  posts: PostItem[];
  prev?: string;
  next?: string;
}

export class PostsPaginator {
  private maxItems: number;
  private jsonDirectory: string;
  private baseUrl: string;
  constructor({ maxItems, jsonDirectory, baseUrl }: PostsPaginatorOptions) {
    this.maxItems = maxItems;
    this.jsonDirectory = jsonDirectory;
    this.baseUrl = baseUrl;
  }

  private async generateFile(data: PostsPage) {
    const filePath = join(
      this.jsonDirectory,
      `${PostsCollection.filename}_${data.current}.json`
    );
    await ensureFileExist(filePath);
    const writeStream = createWriteStream(filePath, "utf-8");
    return pipeline(JSON.stringify(data, null, 2), writeStream);
  }

  public async paginate() {
    try {
      const jsonContent = await getFileContent(
        join(this.jsonDirectory, `${PostsCollection.filename}.json`)
      );
      const { posts: allPosts }: Posts = JSON.parse(jsonContent);

      const postGroups = [];

      for (let i = 0; i < allPosts.length; i += this.maxItems) {
        postGroups.push(allPosts.slice(i, i + this.maxItems));
      }

      const postPages: PostsPage[] = postGroups.map((items, index) => {
        const current = index + 1;
        const directorySegment = getRelativePath(this.jsonDirectory);
        return {
          current,
          posts: items,
          prev:
            current > 1
              ? getUrlPath(
                  join(
                    this.baseUrl,
                    directorySegment,
                    `${PostsCollection.filename}_${current - 1}.json`
                  )
                )
              : undefined,
          next:
            current < postGroups.length
              ? getUrlPath(
                  join(
                    this.baseUrl,
                    directorySegment,
                    `${PostsCollection.filename}_${current + 1}.json`
                  )
                )
              : undefined,
        };
      });

      await Promise.all(postPages.map((item) => this.generateFile(item)));
    } catch (error) {
      console.log("Error paginating:", error);
    }
  }
}
