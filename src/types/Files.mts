export interface FileNode {
  key: string; // primary key is the basename of file(without extname) or directory.
  path: string;
  parent: FileNode | null;
  hash?: string;
  children?: FileNode[];
}

export enum ChangeType {
  Delete = "Delete",
  Create = "Create",
  Modify = "Modify",
}

export interface Change {
  markdown?: FileNode;
  json?: FileNode;
  type: ChangeType;
}
