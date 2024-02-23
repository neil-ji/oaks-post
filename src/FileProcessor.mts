import { readdir, stat } from "fs/promises";
import { join } from "node:path";
import { basename, extname } from "path";
import { calculateHash, readByStream } from "./utils.mjs";
import { Change, ChangeType, FileNode } from "./types/index.mjs";

export class FileProcessor {
  private async extractHash(path: string): Promise<string> {
    const fileExtname = extname(path);
    if (fileExtname === ".md") {
      const content = await readByStream(path);
      return calculateHash(content + path);
    }
    if (fileExtname === ".json") {
      const hashRegExp = /post_([^_]+)_/;
      return path.match(hashRegExp)![1];
    }
    throw new Error(`Failed extract hash from ${path}`);
  }

  private extractPrimaryKey(path: string): string {
    const ext = extname(path);
    const base = basename(path, ext);
    if (ext === ".json") {
      const keyRegExp = /^post_[0-9a-fA-F]{8}_([^_]+)$/;
      const result = base.match(keyRegExp)?.[1];
      if (!result) {
        throw new Error(`Failed extract primary key from: ${path}`);
      }
      return result;
    }
    return base;
  }

  private isSupportedExtname(path: string) {
    const extensionName = extname(path);
    return [".json", ".md", ""].some((item) => item === extensionName);
  }

  private async buildTree(path: string, parent: FileNode | null = null) {
    try {
      const stats = await stat(path);
      const root: FileNode = {
        key: this.extractPrimaryKey(path),
        path,
        parent,
      };

      if (stats.isDirectory()) {
        const children = await readdir(path);
        const filteredChildren = children.filter((child) =>
          this.isSupportedExtname(child)
        );
        const works = filteredChildren.map((child) =>
          this.buildTree(join(path, child), root)
        );
        const nodes = await Promise.all(works);
        root.children = nodes;
      } else {
        root.hash = await this.extractHash(path);
      }

      return root;
    } catch (error: any) {
      console.error(
        `Failed build file tree: ${path}\nDetails: ${error.message}`
      );
      process.exit(1);
    }
  }

  private equalNode(mdNode?: FileNode, jsonNode?: FileNode): boolean {
    return mdNode?.hash === jsonNode?.hash;
  }

  private getNodesPath(node: FileNode): string {
    let key = "";
    let p: FileNode | null = node;
    while (p?.parent) {
      key = p.key + key;
      p = p.parent;
    }
    return key;
  }

  private flat(root: FileNode): Map<string, FileNode> {
    const map = new Map();
    const queue = [root];

    while (queue.length) {
      const node: FileNode = queue.pop()!;
      if (node?.children) {
        queue.push(...node.children);
      } else {
        map.set(this.getNodesPath(node), node);
      }
    }

    return map;
  }

  private equalTree(mdRoot: FileNode, jsonRoot: FileNode): Change[] {
    const changes: Change[] = [];

    // ignore root directory differences between mdRoot and jsonRoot.
    const mdMap = this.flat({ ...mdRoot, key: "" });
    const jsonMap = this.flat({ ...jsonRoot, key: "" });

    // 1. If it exists in markdown but not in json: add a new file;
    // 2. If it exists in both but the hash values do not match: modify the file;
    mdMap.forEach((value, key) => {
      if (!jsonMap.has(key)) {
        changes.push({
          type: ChangeType.Create,
          markdown: value,
        });
      } else if (!this.equalNode(jsonMap.get(key), value)) {
        changes.push({
          type: ChangeType.Modify,
          markdown: value,
          json: jsonMap.get(key),
        });
      }
    });

    // 3. If it exists in json but not in markdown: delete the file.
    jsonMap.forEach((value, key) => {
      if (!mdMap.has(key)) {
        changes.push({
          type: ChangeType.Delete,
          json: value,
        });
      }
    });

    return changes;
  }

  public async build(rootDir: string) {
    return this.buildTree(rootDir);
  }

  public async compare(base: FileNode, compared: FileNode) {
    return this.equalTree(base, compared);
  }
}
