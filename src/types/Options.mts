import { PostItem } from "./Posts.mjs";

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
  categories?: PostsClassifierOptions;
}

/** PostsGenerator */
export interface PostsGeneratorOptions {
  inputDir: string;
  outputDir: string;
}

/** PostsClassifier */
export enum PostsCategoriesAnalyzeRule {
  /**
   * Analyze posts directories as categories.
   */
  Directory = 1,
  FrontMatter,
  Disable,
}

export interface PostsClassifierOptions extends PostsListBase {
  rule?: PostsCategoriesAnalyzeRule;
  propName?: string;
}

export type PostsCategoriesMap = Map<
  string,
  {
    posts: PostItem[];
    subcategories: PostsCategoriesMap;
  }
>;
