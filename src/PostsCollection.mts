import { createWriteStream } from "fs";
import { pipeline } from "stream";
import { ensureFileExist, getFileContent } from "./utils.mjs";

export interface PostFrontMatter {
  title?: string;
  date?: string;
  tags?: string[];
  contentHash?: string;
  [key: string]: any;
}

export interface PostItem {
  hash?: string;
  url?: string;
  frontMatter?: PostFrontMatter;
  content?: string;
}

export interface Posts {
  buildTime: Date;
  posts: PostItem[];
}

export class PostsCollection {
  private data: Posts;
  private descending: boolean;

  constructor(descending = false) {
    this.data = {
      buildTime: new Date(),
      posts: [],
    };
    this.descending = descending;
  }

  // Method to sort the posts based on their dates, in descending order if specified
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

  // TODO: using hash map may be better
  private deleteByHash(posts: PostItem[], hash?: string) {
    if (!hash) return;

    const targetIndex = posts.findIndex((item) => item.hash === hash);

    posts.splice(targetIndex, 1);
  }

  // Method to add a new post item to the collection
  public collect(item: PostItem) {
    this.data.posts.push(item);
  }

  // Method to clear all posts from the collection
  // public clear() {
  //   this.data = {
  //     buildTime: new Date(),
  //     posts: [],
  //   };
  // }

  // Method to persist the current state of the data into a JSON file
  public async persist(outputDir: string, existedJsonHashes: string[]) {
    // !!!
    const hasAddOrUpdate = this.data.posts.length > 0;
    const hasDelete = existedJsonHashes.length > 0;
    if (!hasAddOrUpdate && !hasDelete) {
      console.log("posts.json has no changed. Skipping...");
      return;
    }

    const jsonPath = `${outputDir}/posts.json`;

    try {
      await ensureFileExist(jsonPath);
      // 1. If posts.json has data, it would be merged.with new data.
      const json = await getFileContent(jsonPath);
      if (json !== "") {
        const existedPosts: Posts = JSON.parse(json);
        existedJsonHashes.forEach((hash) => {
          this.deleteByHash(existedPosts.posts, hash);
        });
        this.data = {
          ...this.data,
          posts: [...existedPosts.posts, ...this.data.posts],
        };
      }
      this.sort();

      // 2. Write the JSON data to the file
      const writeStream = createWriteStream(jsonPath);
      await pipeline(
        JSON.stringify(this.data, null, 2),
        writeStream,
        (error) => {
          if (error) {
            console.error("Error writing JSON to posts.json:", error);
          } else {
            console.log("Data persisted successfully.");
          }
        }
      );
    } catch (error) {
      console.error("Error generating posts.json file:", error);
    }
  }
}
