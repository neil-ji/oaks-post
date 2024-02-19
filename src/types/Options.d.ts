import { PostItem } from "./Posts";

export enum PostsExcerptRule {
  ByLines = 1,
  CustomTag = 2,
}

// PostsCollection
export interface PostsCollectionOptions {
  baseUrl?: string;
  sort?: (a: PostItem, b: PostItem) => number;
  excerpt?: {
    rule: PostsExcerptRule;
    lines?: number;
    tag?: string;
  };
}

// PostsTagger
export interface PostsTaggerOptions {
  outputDir: string;
  baseUrl: string;
  propName?: string;
}

// PostsPaginator
export interface PostsPaginatorOptions {
  itemsPerPage?: number;
  baseUrl?: string;
  outputDir: string;
}

// PostsManager
export interface PostsManagerOptions extends PostsCollectionOptions {
  inputDir: string;
  outputDir: string;
  itemsPerPage?: number;
}
