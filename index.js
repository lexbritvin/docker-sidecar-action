import * as core from "@actions/core";

import {
  setup,
  cleanup,
  IsPost,
} from "docker-sidecar-action/src";

try {
  if (!IsPost) {
    await setup()
  }
  else {
    await cleanup()
  }
} catch (error) {
  core.setFailed(`Action failed with error: ${error.message}`);
}
