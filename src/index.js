import * as core from "@actions/core";

import { cleanup } from "./post.js";
import { setup } from "./setup.js";

const IsPost = !!core.getState('isPost');

try {
  if (!IsPost) {
    core.saveState('isPost', 'true')
    await setup()
  }
  else {
    await cleanup()
  }
} catch (error) {
  core.setFailed(`Action failed with error: ${error.message}`);
}
