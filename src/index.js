import * as core from "@actions/core";

export const IsPost = !!core.getState('isPost');
export { cleanup } from "./post.js";
export { setup } from "./setup.js";