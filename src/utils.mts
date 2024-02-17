import murmurhash from "murmurhash";
import { createHash } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import {
  access,
  mkdir,
  readdir,
  rmdir,
  stat,
  unlink,
  writeFile,
} from "node:fs/promises";
import {
  dirname,
  format,
  join,
  ParsedPath,
  relative,
  resolve,
  sep,
} from "node:path";
import { pipeline } from "node:stream/promises";
import { PostItem } from "./PostsCollection.mjs";

export async function readByStream(path: string) {
  const readStream = createReadStream(path, "utf-8");
  const chunks: string[] = [];

  // Read file content
  for await (const chunk of readStream) {
    chunks.push(chunk);
  }

  return chunks.join("");
}

export async function writeByStream(path: string, content: string) {
  const writeStream = createWriteStream(path, "utf-8");
  await pipeline(content, writeStream);
}

export function normalizePath(pathLike?: string | number | ParsedPath) {
  let normalizedPath;
  switch (typeof pathLike) {
    case "string":
      normalizedPath = pathLike;
      break;
    case "number":
      normalizedPath = String(pathLike);
      break;
    case "object":
      normalizedPath = format(pathLike);
      break;
    default:
      normalizedPath = "";
      break;
  }
  return resolve(normalizedPath);
}

export function getRelativePath(pathLike?: string | number | ParsedPath) {
  return relative(process.cwd(), normalizePath(pathLike));
}

export function getUrlPath(path: string) {
  return path.split(sep).join("/");
}

export function getExcerpt(input: string, limit: number): string {
  const lines = input.split("\n");
  let output = "";
  let codeBlock = false;
  let codeBlockLineCount = 0;

  for (let i = 0; i < lines.length && limit > 0; i++) {
    const line = lines[i];
    if (line.startsWith("```")) {
      codeBlock = !codeBlock;
      output += line + "\n";
      if (codeBlock) {
        codeBlockLineCount = 0;
      }
    } else if (codeBlock) {
      output += line + "\n";
      codeBlockLineCount++;
    } else if (line.trim() === "") {
      // Add empty lines to output
      output += "\n";
    } else {
      output += line + "\n";
      limit--;
    }
  }

  if (codeBlock && codeBlockLineCount > 0) {
    // If the last line was part of a code block, we close the block
    output += "```\n";
  }

  return output.trim();
}

export function getCustomExcerpt(content: string, tag: string) {
  return content.slice(0, content.indexOf(tag));
}

export function calculateHash(content: string, length = 8) {
  const hash = murmurhash.v3(content);
  return hash.toString(16).padStart(length, "0");
}

export function generateUniqueHash(input = "", length = 8) {
  const hash = createHash("sha256");
  hash.update(input);
  return hash.digest("hex").slice(0, length);
}

export async function ensureDirExisted(dir: string) {
  try {
    // Check if directory exists
    await access(dir);
  } catch (error: any) {
    // If directory does not exist, create it
    if (error.code === "ENOENT") {
      await mkdir(dir);
    } else {
      throw error; // Re-throw other errors
    }
  }
}

export async function ensureFileExist(path: string) {
  try {
    // Check if file exists
    await access(path);
  } catch (error: any) {
    // If file does not exist, create it
    if (error.code === "ENOENT") {
      await writeFile(path, "");
    } else {
      throw error; // Re-throw other errors
    }
  }
}

async function deleteEmptyParentDirs(dir: string) {
  const files = await readdir(dir);
  if (files.length === 0) {
    await rmdir(dir);
    const parentDir = dirname(dir);
    await deleteEmptyParentDirs(parentDir);
  }
}

export async function deleteFileRecursively(path: string) {
  await unlink(path);
  await deleteEmptyParentDirs(dirname(path));
}

export async function deleteDir(dir: string) {
  try {
    const items = await readdir(dir);

    for (const item of items) {
      const itemPath = join(dir, item);
      const stats = await stat(itemPath);

      if (stats.isFile()) {
        await unlink(itemPath);
      } else if (stats.isDirectory()) {
        await deleteDir(itemPath);

        const itemsInDir = await readdir(itemPath);
        if (itemsInDir.length === 0) {
          await rmdir(itemPath);
        }
      }
    }
  } catch (error) {
    console.error(`Error deleting directory: ${dir}`, error);
  }
}

const sortImpl =
  (ascending: boolean) =>
  (propName: string, format?: (propValue: any) => any) =>
  (cur: PostItem, next: PostItem) => {
    const curValue = cur.frontMatter?.[propName];
    const nextValue = next.frontMatter?.[propName];

    const formattedCurValue = format ? format(curValue) : curValue;
    const formattedNextValue = format ? format(nextValue) : nextValue;
    if (
      typeof formattedCurValue === "string" &&
      typeof formattedNextValue === "string"
    ) {
      // Support natural language order sort.
      const compare = new Intl.Collator(undefined, {
        numeric: true,
        sensitivity: "base",
      }).compare;
      return ascending
        ? compare(formattedCurValue, formattedNextValue)
        : compare(formattedNextValue, formattedCurValue);
    }
    if (
      formattedCurValue instanceof Date &&
      formattedNextValue instanceof Date
    ) {
      return ascending
        ? formattedCurValue.valueOf() - formattedNextValue.valueOf()
        : formattedNextValue.valueOf() - formattedCurValue.valueOf();
    }
    return 0;
  };

export function sortDateAscend(
  propName = "date",
  format?: (propValue: any) => Date
) {
  return sortImpl(true)(propName, format);
}

export function sortDateDescend(
  propName = "date",
  format?: (propValue: any) => Date
) {
  return sortImpl(false)(propName, format);
}

export function sortLexOrderAscend(
  propName = "title",
  format?: (propValue: any) => string
) {
  return sortImpl(true)(propName, format);
}

export function sortLexOrderDescend(
  propName = "title",
  format?: (propValue: any) => string
) {
  return sortImpl(false)(propName, format);
}
