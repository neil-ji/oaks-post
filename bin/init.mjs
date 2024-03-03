#!/usr/bin/env node
import { writeFile, access } from "fs/promises";
import { join } from "path";

async function init() {
  const path = join(process.cwd(), "posts.config.json");
  const template = `{
    "baseUrl": "",
    "inputDir": "",
    "outputDir": ""
}`;

  try {
    await access(path);
    console.log("posts.config.json already exists.");
  } catch (error) {
    if (error.code === "ENOENT") {
      await writeFile(path, template, "utf-8");
      console.log("Successfully create posts.config.json");
    } else {
      console.error("Failed create posts.config.json", error);
    }
  }
}

init();
