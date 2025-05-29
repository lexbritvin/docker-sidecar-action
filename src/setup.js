import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as path from "path";
import * as fs from "fs";
import * as github from "@actions/github";

export async function setup() {
  const runId = github.context.runId;

  core.info(`Starting Linux Docker sidecar`);

  // Check for GitHub CLI
  try {
    await exec.exec("gh", ["--version"]);
  } catch (error) {
    core.error("GitHub CLI not found. Please install it using actions/setup-gh");
    throw new Error("GitHub CLI is required for this action");
  }

  // Wait for sidecar to start and provide connection details
  core.info("Waiting for sidecar to start...");

  const maxAttempts = 30;
  let attempt = 0;
  let sidecarStarted = false;

  while (attempt < maxAttempts) {
    attempt++;

    try {
      // Try to download the connection details artifact
      const downloadParams = [
        "run", "download",
        runId,
        "--name", `sidecar-details`,
        "--repo", process.env.GITHUB_REPOSITORY,
      ];

      const exitCode = await exec.exec("gh", downloadParams, { ignoreReturnCode: true });

      if (exitCode === 0) {
        core.info("Sidecar started successfully");
        sidecarStarted = true;
        break;
      }
    } catch (error) {
      // Ignore error and retry
    }

    core.info(`Waiting for sidecar to start (attempt ${attempt}/${maxAttempts})...`);
    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
  }

  if (!sidecarStarted) {
    throw new Error("Timed out waiting for sidecar to start");
  }

  // Read connection details
  const details = fs.readFileSync("sidecar-details.env", "utf8");
  const dockerHost = details.match(/DOCKER_HOST=(.*)/)[1];

  core.setOutput("docker-host", dockerHost);
  core.exportVariable("DOCKER_HOST", dockerHost);

  // Download Docker certificates
  const dockerCertsName = "docker-certs";
  await exec.exec("gh", [
    "run", "download",
    runId,
    "--name", dockerCertsName,
    "--repo", process.env.GITHUB_REPOSITORY,
    "--dir", dockerCertsName,
  ]);

  // Set certificate path
  const certPath = path.join(process.cwd(), dockerCertsName);

  core.setOutput("docker-cert-path", certPath);
  core.exportVariable("DOCKER_CERT_PATH", certPath);

  // Set TLS verification
  if (core.getInput("tlsVerify") === "true") {
    core.exportVariable("DOCKER_TLS_VERIFY", "1");
  }

  // Log Docker environment variables
  core.info("Docker environment variables:");
  core.info(`DOCKER_HOST=${process.env.DOCKER_HOST}`);
  core.info(`DOCKER_CERT_PATH=${process.env.DOCKER_CERT_PATH}`);
  core.info(`DOCKER_TLS_VERIFY=${process.env.DOCKER_TLS_VERIFY || ""}`);

  // Test Docker connection
  core.info("Testing Docker connection...");
  await exec.exec("docker", ["info"]);

  core.info("Docker sidecar setup complete");
}
