#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const child_process = require("child_process");
const { rimraf } = require("rimraf");

const projectRoot = path.resolve(__dirname, "..");
const distRoot = path.resolve(projectRoot, "dist");

const main = async () => {
  // clean the dist folder
  await rimraf(distRoot);

  // perform the build
  child_process.execSync("pnpm run build", {
    cwd: projectRoot,
  });

  // remove the examples folder from the dist folder
  await rimraf(path.resolve(distRoot, "examples"));

  // generate the package.json file from the original package.json file
  const packageJson = require(path.resolve(projectRoot, "package.json"));

  // generate the new package.json file
  let newPackageJson = {
    ...packageJson,
    main: "./src/index.js",
    types: "./src/index.d.ts",
    scripts: undefined,
    devDependencies: undefined,
  };
  newPackageJson["exports"]["."]["types"] = "./src/index.d.ts";
  newPackageJson["exports"]["."]["default"] = "./src/index.js";
  newPackageJson["exports"]["./*"]["types"] = "./src/*.d.ts";
  newPackageJson["exports"]["./*"]["default"] = "./src/*.js";

  // write the new package.json file
  await fs.promises.writeFile(
    path.resolve(distRoot, "package.json"),
    JSON.stringify(newPackageJson, null, 2),
  );

  // copy the README.md file
  await fs.promises.copyFile(
    path.resolve(projectRoot, "README.md"),
    path.resolve(distRoot, "README.md"),
  );

  // copy the LICENSE file
  await fs.promises.copyFile(
    path.resolve(projectRoot, "LICENSE"),
    path.resolve(distRoot, "LICENSE"),
  );
};

main();
