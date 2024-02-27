import { readdir, stat } from "fs/promises";
import { join } from "node:path";
import { basename, dirname, extname, relative } from "path";
import { calculateHash, readByStream } from "./utils.mjs";
import { Change, ChangeType, FileNode, Post } from "./types/index.mjs";

export class FileProcessor {
  private async extractHash(path: string): Promise<string> {
    const fileExtname = extname(path);
    const content = await readByStream(path);
    if (fileExtname === ".md" || fileExtname === ".markdown") {
      return calculateHash(content + path);
    }
    if (fileExtname === ".json") {
      const data: Post = JSON.parse(content);
      return data.hash;
    }
    throw new Error(`Failed extract hash from ${path}`);
  }

  private isSupportedExtname(path: string) {
    const extensionName = extname(path);
    return [".json", ".md", ".markdown", ""].some(
      (item) => item === extensionName
    );
  }

  private equalNode(mdNode?: FileNode, jsonNode?: FileNode): boolean {
    return mdNode?.hash === jsonNode?.hash;
  }

  private flat(root: FileNode): Map<string, FileNode> {
    const map = new Map();
    const queue = [root];

    while (queue.length) {
      const node: FileNode = queue.pop()!;
      if (node?.children) {
        queue.push(...node.children);
      } else {
        map.set(node.key, node);
      }
    }

    return map;
  }

  private equalTree(mdRoot: FileNode, jsonRoot: FileNode): Change[] {
    const changes: Change[] = [];

    // ignore root directory differences between mdRoot and jsonRoot.
    const mdMap = this.flat({ ...mdRoot });
    const jsonMap = this.flat({ ...jsonRoot });

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

  public build(rootDir: string) {
    const buildImpl = async (path: string) => {
      try {
        const stats = await stat(path);

        const relativeParentDir = relative(rootDir, dirname(path));
        const base = basename(path, extname(path));
        const root: FileNode = {
          key: join(relativeParentDir, base),
          abstractPath: path,
          relativePath: relative(rootDir, path),
          hash: "",
        };

        if (stats.isDirectory()) {
          const children = await readdir(path);
          const filteredChildren = children.filter((child) =>
            this.isSupportedExtname(child)
          );
          const works = filteredChildren.map((child) =>
            buildImpl(join(path, child))
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
    };

    return buildImpl(rootDir);
  }

  public compare(base: FileNode, compared: FileNode) {
    return this.equalTree(base, compared);
  }
}
