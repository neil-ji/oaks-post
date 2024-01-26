import { createWriteStream } from "fs";
import { pipeline } from "stream";

// Define the structure of the front matter for each post
interface PostFrontMatter {
  title?: string;
  date?: string | Date;
  tags?: string[];
  contentHash?: string;
  [key: string]: any;
}

// Define the structure of a post item
interface PostItem {
  frontMatter?: PostFrontMatter;
  content?: string;
}

// Define the structure of the overall posts database
interface Posts {
  buildTime: Date;
  posts: PostItem[];
}

// Class to manage and manipulate a collection of posts
export class PostsDatabase {
  public data: Posts;

  // Constructor initializes the data structure with an empty array of posts
  constructor() {
    this.data = {
      buildTime: new Date(),
      posts: [],
    };
  }

  // Method to add a new post item to the collection
  public collect(postItem: PostItem) {
    this.data?.posts.push(postItem);
  }

  // Method to clear all posts from the collection
  public clear() {
    this.data = {
      buildTime: new Date(),
      posts: [],
    };
  }

  // Method to sort the posts based on their dates, in descending order if specified
  public sort(descending?: boolean) {
    this.data?.posts.sort((a, b) => {
      const dateA = a?.frontMatter?.date || new Date();
      const dateB = b?.frontMatter?.date || new Date();
      const sortBy = dateA.valueOf() > dateB.valueOf();
      return !descending && sortBy ? 1 : -1;
    });
  }

  // Method to persist the current state of the data into a JSON file
  public persist(outputDir: string) {
    if (!this.data) return;

    // Create a write stream to the specified output directory
    const writeStream = createWriteStream(`${outputDir}/db.json`);
    
    // Use pipeline to efficiently write the JSON data to the file
    pipeline(JSON.stringify(this.data, null, 2), writeStream, (error) => {
      if (error) {
        console.error("Error writing JSON to file:", error);
      } else {
        console.log("Data persisted successfully.");
      }
    });
  }
}
