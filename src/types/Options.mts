import { PostsItem } from "./Posts.mjs";

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
  /** Sort posts array */
  sort?: (a: PostsItem, b: PostsItem) => number;

  /** Settings for post excerpt analyzing */
  excerpt?: PostsExcerptOptions;

  /** Enable paginate and specify max items count of per page */
  itemsPerPage?: number;

  /** Specify output directory for posts and pages. Absolute or relative path are both worked */
  outputDir?: string;
}

/** PostsCollection */
export interface PostsCollectionOptions extends PostsListBase {}

/** PostsTagger */
export interface PostsTaggerOptions extends PostsListBase {
  /** Specify prop name in the markdown front matter to replace default prop `tag`. */
  propName?: string;
}

/** PostsPaginator */
export interface PostsPaginatorOptions {
  outputDir: string;
  itemsPerPage: number;
  baseUrl: string;
}

/** Settings for PostsManager */
export interface PostsManagerOptions {
  /** Directory of your markdown files. Absolute or relative path are both worked */
  inputDir: string;

  /** Directory of outputted json files. Absolute or relative path are both worked */
  outputDir: string;

  /** `baseUrl` is the prefix of outputted files links,
   * for example: `baseUrl: https://yourwebsite.com` will generate post link like
   * `https://yourwebsite.com/outputDir/post_1b2ae363_HelloOaks.json` */
  baseUrl?: string;

  /** Settings for posts collection */
  collections?: PostsCollectionOptions;

  /** Settings for posts tags */
  tags?: PostsTaggerOptions;

  // archives?: PostsArchiveOptions;

  /** Settings for posts categories */
  categories?: PostsClassifierOptions;
}

/** PostsGenerator */
export interface PostsGeneratorOptions {
  inputDir: string;
  outputDir: string;
}

/** A enum to control posts categories analyzing type. */
export enum PostsCategoriesAnalyzeRule {
  /** Analyze posts categories from markdown directories. */
  Directory = 1,

  /** Analyze posts categories from markdown front matter. */
  FrontMatter,

  /** Disable posts categories analyzing. */
  Disable,
}

/** PostsClassifier */
export interface PostsClassifierOptions extends PostsListBase {
  /** Control posts categories analyzing. */
  rule?: PostsCategoriesAnalyzeRule;

  /** Specify prop name in the markdown front matter to replace default prop `category`. */
  propName?: string;
}

export type PostsCategoriesMap = Map<
  string,
  {
    posts: PostsItem[];
    subcategories: PostsCategoriesMap;
  }
>;
