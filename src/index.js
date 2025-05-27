import * as core from "@actions/core";

import { setup } from "./setup.js";

try {
  await setup()
} catch (error) {
  core.setFailed(`Action failed with error: ${error.message}`);
}
