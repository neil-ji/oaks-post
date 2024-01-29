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
