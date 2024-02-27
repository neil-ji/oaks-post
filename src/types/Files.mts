export interface FileNode {
  key: string;
  abstractPath: string;
  relativePath: string;
  hash: string;
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
