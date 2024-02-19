export interface PostFrontMatter {
  [key: string]: any;
}

export interface RawPostItem {
  path: string;
  hash: string;
  frontMatter: PostFrontMatter;
  content: string;
}

export interface PostItem {
  hash?: string;
  url?: string;
  frontMatter?: PostFrontMatter;
  excerpt?: string;
}

export interface Posts {
  buildTime: Date;
  posts: PostItem[];
}

export interface PostsPage {
  pages: number;
  current: number;
  posts: PostItem[];
  prev?: string;
  next?: string;
}
