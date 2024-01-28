import { createReadStream } from "node:fs";
import { access, writeFile } from "node:fs/promises";
import { format, ParsedPath, relative, resolve, sep } from "node:path";

export async function getFileContent(path: string) {
  const readStream = createReadStream(path, "utf-8");
  const chunks: string[] = [];

  // Read file content
  for await (const chunk of readStream) {
    chunks.push(chunk);
  }

  return chunks.join("");
}

export async function ensureFileExist(path: string) {
  try {
    // Check if file exists
    await access(path);
  } catch (error: any) {
    // If file does not exist, create it
    if (error.code === "ENOENT") {
      await writeFile(path, "");
      console.log(`${path} doesn't exist. Creating...`);
    } else {
      throw error; // Re-throw other errors
    }
  }
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
