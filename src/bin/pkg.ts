#!/usr/bin/env node

import { createDistPackage } from "../utils/package.js";

await createDistPackage({
  packageJsonFilepath: "package.json",
});
