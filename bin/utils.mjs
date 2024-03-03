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
import path from "path";
import { readFile } from "fs/promises";

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
    path.join(process.cwd(), "posts.config.json"),
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

      // Aliases
      "-c": "--clean",
    },
    { argv: process.argv }
  );

  const { ["--clean"]: clean } = args;

  return { clean };
}
