#!/usr/bin/env node
import { analyzeArguments, createManager } from "./utils.mjs";

async function run() {
  const { clean } = analyzeArguments();
  const manager = await createManager();

  if (clean) {
    await manager.clean();
    console.log("All remained files have been cleaned.");
  }
  await manager.start();
}

run();
