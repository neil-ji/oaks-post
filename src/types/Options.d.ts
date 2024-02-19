import { PostItem } from "./Posts";

export enum PostsExcerptRule {
  ByLines = 1,
  CustomTag = 2,
  NoContent = 3,
  FullContent = 4,
}

export interface PostsExcerptOptions {
  rule: PostsExcerptRule;
  lines?: number;
  tag?: string;
}

/** Common List Interface */

interface PostsListBase {
  sort?: (a: PostItem, b: PostItem) => number;
  excerpt?: PostsExcerptOptions;
  itemsPerPage?: number;
  outputDir?: string;
}

/** PostsCollection */
export interface PostsCollectionOptions extends PostsListBase {}

/** PostsTagger */
export interface PostsTaggerOptions extends PostsListBase {
  propName?: string;
}

/** PostsPaginator */
export interface PostsPaginatorOptions {
  outputDir: string;
  itemsPerPage: number;
  baseUrl: string;
}

/** PostsManager */
export interface PostsManagerOptions {
  inputDir: string;
  outputDir: string;
  baseUrl?: string;
  collections?: PostsCollectionOptions;
  tags?: PostsTaggerOptions;
  // archives?: PostsArchiveOptions;
  // categories?: PostsCategoryOptions;
}
