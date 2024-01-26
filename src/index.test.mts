import fs from "fs/promises";
import { strict as assert } from "assert";
import { MarkdownProcessor } from "./index.mjs";

const testProcessMarkdownFiles = async () => {
  // Define your test directories and files
  const testMarkdownDirectory = "test-markdown";
  const testOutputDirectory = "test-output";

  // Create test directories and files
  await fs.mkdir(testMarkdownDirectory, { recursive: true });
  await fs.mkdir(testOutputDirectory, { recursive: true });

  const markdownContent = "---\ntitle: Test File\n---\nTest content";

  // Create a test markdown file
  await fs.writeFile(`${testMarkdownDirectory}/testFile.md`, markdownContent);

  // Run the function to be tested
  const markdownProcessor = new MarkdownProcessor();
  await markdownProcessor.processFiles(
    testMarkdownDirectory,
    testOutputDirectory
  );

  // Check if the JSON file was generated

  const files = await fs.readdir(testOutputDirectory);
  const regExp = /post_\w+/;
  for (const file of files) {
    assert.ok(regExp.test(file), "JSON file name was wrong.");

    const jsonFilePath = `${testOutputDirectory}/${file}`;
    const jsonFileExists = await fs
      .access(jsonFilePath)
      .then(() => true)
      .catch(() => false);
    assert.ok(jsonFileExists, `JSON file ${jsonFilePath} was not generated.`);
  }

  // Simulate modifying the markdown file
  const modifiedMarkdownContent =
    "---\ntitle: Modified Test File\n---\nModified test content";
  await fs.writeFile(
    `${testMarkdownDirectory}/testFile.md`,
    modifiedMarkdownContent
  );

  // Run the function again after modification
  await markdownProcessor.processFiles(
    testMarkdownDirectory,
    testOutputDirectory
  );

  // Check if the JSON file was regenerated
  for (const file of files) {
    assert.ok(regExp.test(file), "JSON file name was wrong.");

    const jsonFilePath = `${testOutputDirectory}/${file}`;
    const jsonFileExists = await fs
      .access(jsonFilePath)
      .then(() => true)
      .catch(() => false);
    assert.ok(
      jsonFileExists,
      `Regenerated JSON file ${jsonFilePath} was not generated after modification.`
    );
  }

  // Clean up: remove test directories and files
  await fs.rm(testMarkdownDirectory, { recursive: true });
  await fs.rm(testOutputDirectory, { recursive: true });
  console.log("Cases are all passed.");
};

// Run the test
testProcessMarkdownFiles().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
