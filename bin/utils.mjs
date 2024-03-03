import {
  PostsExcerptRule,
  PostsCategoriesAnalyzeRule,
  PostsManager,
  sortDateAscend,
  sortDateDescend,
  sortLexOrderAscend,
  sortLexOrderDescend,
} from "../dist/index.mjs";
import arg from "arg";
import { readFile, writeFile, access } from "fs/promises";
import { join } from "path";
import readline from "node:readline/promises";

function mapStrToSort(str) {
  switch (str) {
    case "date ascend":
      return sortDateAscend;
    case "date descend":
      return sortDateDescend;
    case "lex ascend":
      return sortLexOrderAscend;
    case "lex descend":
      return sortLexOrderDescend;
    default:
      return undefined;
  }
}

export async function createManager() {
  const data = await readFile(
    join(process.cwd(), "posts.config.json"),
    "utf-8"
  );

  const config = JSON.parse(data);
  const { baseUrl, outputDir, inputDir, collection, tag, category } = config;

  const options = { baseUrl, outputDir, inputDir };

  if (collection) {
    options.collection = {
      ...collection,
      excerpt: {
        ...collection?.excerpt,
        rule: PostsExcerptRule?.[collection?.excerpt?.rule],
      },
      sort: mapStrToSort(collection?.sort),
    };
  }
  if (tag) {
    options.tag = {
      ...tag,
      excerpt: {
        ...collection?.excerpt,
        rule: PostsExcerptRule?.[collection?.excerpt?.rule],
      },
      sort: mapStrToSort(tag?.sort),
    };
  }
  if (category) {
    options.category = {
      ...category,
      rule: PostsCategoriesAnalyzeRule?.[category?.rule],
      excerpt: {
        ...collection?.excerpt,
        rule: PostsExcerptRule?.[collection?.excerpt?.rule],
      },
      sort: mapStrToSort(category?.sort),
    };
  }

  return new PostsManager(options);
}

export function analyzeArguments() {
  // Parse the arguments passed by user
  const args = arg(
    {
      // Types
      "--clean": Boolean,
      "--init": Boolean,
      "--build": Boolean,

      // Aliases
      "-c": "--clean",
      "-i": "--init",
      "-b": "--build",
    },
    { argv: process.argv }
  );

  const { ["--clean"]: c, ["--init"]: i, ["--build"]: b } = args;

  return { c, i, b };
}

async function ask(path) {
  const template = {};
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    template.inputDir = await rl.question("inputDir: ");
    template.outputDir = await rl.question("outputDir: ");
    template.baseUrl = await rl.question("baseUrl: ");
    const result = await rl.question("Print 'y/n' to continue: ");
    rl.close();

    if (result.toLowerCase() === "y") {
      await writeFile(path, JSON.stringify(template, null, 2), "utf-8");
      console.log("Successfully created posts.config.json");
    } else {
      process.exit();
    }
  } catch (error) {
    console.error("Failed to read user input:", error);
  }
}

export async function init() {
  const path = join(process.cwd(), "posts.config.json");
  try {
    await access(path);
    console.log("posts.config.json already exists.");
  } catch (error) {
    if (error.code === "ENOENT") {
      await ask(path);
    } else {
      console.error("Failed to create posts.config.json", error);
    }
  }
}
