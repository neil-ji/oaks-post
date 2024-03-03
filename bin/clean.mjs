#!/usr/bin/env node
import { createManager } from "./utils.mjs";

async function run() {
  const manager = await createManager();
  await manager.clean();
  console.log("All remained files have been cleaned.");
}

run();
