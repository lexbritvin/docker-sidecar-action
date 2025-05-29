import * as core from "@actions/core";
import * as path from "path";
import * as fs from "fs";
import { DefaultArtifactClient } from "@actions/artifact";

// For the cleanup part that was failing:
export async function cleanup() {
  core.info(`Shutting down sidecar`);

  // Create a file to signal shutdown
  const shutdownFilePath = path.join(process.cwd(), "shutdown-signal.txt");
  fs.writeFileSync(shutdownFilePath, `Shutdown requested at ${new Date().toISOString()}`);

  // Upload the shutdown signal using @actions/artifact
  const artifact = new DefaultArtifactClient();
  const artifactName = `stop-sidecar`;
  const files = [shutdownFilePath];
  const rootDirectory = process.cwd();

  core.info(`Uploading shutdown signal as artifact: ${artifactName}`);

  await artifact.uploadArtifact(
    artifactName,
    files,
    rootDirectory,
    { retentionDays: 1 }
  );

  core.info("Cleanup completed");
}
