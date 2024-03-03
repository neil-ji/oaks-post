#!/usr/bin/env node

import { analyzeArguments, createManager, init } from "./utils.mjs";

async function run() {
  const { b, c, i } = analyzeArguments();

  i && (await init());

  if (c || b) {
    const manager = await createManager();
    c && (await manager.clean());
    b && (await manager.start());
  }
}

run();
