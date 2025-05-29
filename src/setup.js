import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as path from "path";
import * as fs from "fs";
import { DefaultArtifactClient } from "@actions/artifact";

export async function setup() {
  core.info(`Starting Linux Docker sidecar`);

  // Wait for sidecar to start and provide connection details
  core.info("Waiting for sidecar to start...");

  const maxAttempts = 30;
  let attempt = 0;
  let sidecarStarted = false;

  const artifact = new DefaultArtifactClient();

  while (attempt < maxAttempts) {
    attempt++;

    try {
      const detailsInfo = await artifact.getArtifact(`sidecar-details`);
      if (detailsInfo.artifact.id) {
        const details = await artifact.downloadArtifact(
          detailsInfo.artifact.id,
          { path: "." },
        );
        if (details.downloadPath) {
          core.info("Sidecar started successfully");
          sidecarStarted = true;
          break;
        }
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
  const certsInfo = await artifact.getArtifact(dockerCertsName);
  if (!certsInfo.artifact.id) {
    throw new Error("Failed to find Docker certificates in artifacts");
  }

  const certs = await artifact.downloadArtifact(
    certsInfo.artifact.id,
    { path: dockerCertsName },
  );
  if (!certs.downloadPath) {
    throw new Error("Failed to download Docker certificates");
  }

  // Set certificates path
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
