export interface PostFrontMatter {
  [key: string]: any;
}

export interface RawPostsItem extends Post {
  path: string;
  hash: string;
}

export interface ExcerptedPost {
  /** Markdown front matter */
  frontMatter?: PostFrontMatter;

  /** Excerpt from Markdown content */
  excerpt?: string;
}

/** Post element in the Posts List */
export interface PostsItem extends ExcerptedPost {
  /** Unique identifier of a post */
  hash?: string;

  /** URL of a post */
  url?: string;
}

/** Single post file */
export interface Post {
  /** Unique identifier of a post */
  hash: string;

  /** Markdown front matter */
  frontMatter: PostFrontMatter;

  /** Markdown content */
  content: string;
}

/** Posts pages file */
export interface PostsPage {
  /** Aggregate of posts pages */
  pages: number;

  /** Current page index */
  current: number;

  /** Posts set of each page */
  posts: PostsItem[];

  /** URL of current page */
  url: string;

  /** URL of previous page */
  prev?: string;

  /** URL of next page */
  next?: string;
}

/** Posts collection file */
export interface PostsCollection extends Posts {
  /** Unique identifier of outputted resource every times */
  version: string;
}

export interface Posts {
  /** Partial or all posts */
  posts: PostsItem[];

  /** URLs of posts pages */
  postsPages?: string[];
}

/** Posts tags collection file */
export interface PostTagsCollection {
  /** Unique identifier of outputted resource every times */
  version: string;

  /** All tags */
  tags: PostTagsItem[];
}

export interface PostTagsItem extends Posts {
  /** Tag name */
  tag: string;
}

/** Posts categories collection file */
export interface PostCategoriesCollection {
  /** Unique identifier of outputted resource every times */
  version: string;

  /** All categories */
  categories: PostCategoriesItem[];
}

export interface PostCategoriesItem extends Posts {
  /** Category name */
  category: string;

  /** Subcategories */
  subcategories: PostCategoriesItem[];
}
