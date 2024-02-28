import { PostsItem } from "./Posts.mjs";

export enum PostsExcerptRule {
  /** Extract excerpt by specific lines of markdown content */
  ByLines = 1,

  /** Extract excerpt by specific tag of markdown content, for example: `<!--more-->` */
  CustomTag,

  /** Force return empty string */
  NoContent,

  /** Return markdown content directly  */
  FullContent,
}

export interface PostsExcerptOptions {
  /** Control excerpt analyzing, default: `PostsExcerptRule.ByLines`*/
  rule: PostsExcerptRule;

  /** Specify markdown content max lines, default: `10`  */
  lines?: number;

  /** Specify split tag in the markdown content, default: `<!--more-->` */
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

/** PostsCollector */
export interface PostsCollectorOptions extends PostsListBase {}

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
  collections?: PostsCollectorOptions;

  /** Settings for tags */
  tags?: PostsTaggerOptions;

  // archives?: PostsArchiveOptions;

  /** Settings for categories */
  categories?: PostsClassifierOptions;
}

/** PostsGenerator */
export interface PostsGeneratorOptions {
  inputDir: string;
  outputDir: string;
}

/** A enum to control posts categories analyzing type. */
export enum PostsCategoriesAnalyzeRule {
  /** Analyze posts categories from markdown front matter. */
  FrontMatter = 1,

  /** Analyze posts categories from markdown directories. */
  // Directory,

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
