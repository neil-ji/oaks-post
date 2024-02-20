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
  posts: PostItem[];
  postsPages: string[];
}

export interface PostsPage {
  pages: number;
  current: number;
  posts: PostItem[];
  url: string;
  prev?: string;
  next?: string;
}

export interface PostTagItem extends Posts {
  tag: string;
}
