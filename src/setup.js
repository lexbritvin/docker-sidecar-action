import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as path from "path";
import * as fs from "fs";
import { DefaultArtifactClient } from "@actions/artifact";

export async function setup() {
  // Wait for a sidecar to start and provide connection details
  core.info("Waiting for sidecar to start...");

  // Wait for a sidecar to upload connection details.
  if (!await waitSidecarStarted()) {
    throw new Error("Timed out waiting for sidecar to start");
  }

  // Read connection details
  const details = fs.readFileSync("sidecar-details.env", "utf8");
  const dockerHost = details.match(/DOCKER_HOST=(.*)/)[1];
  const tlsVerify = details.match(/DOCKER_TLS_VERIFY=(.*)/)[1] === "1";

  // Set Docker host
  core.exportVariable("DOCKER_HOST", dockerHost);

  // Check if TLS verification is enabled
  if (tlsVerify) {
    const certPath = await setupDockerCertificates();
    // Set env variables for docker execution
    core.exportVariable("DOCKER_CERT_PATH", certPath);
    core.exportVariable("DOCKER_TLS_VERIFY", "1");
  }

  // Log Docker environment variables
  core.info("Docker environment variables:");
  core.info(`DOCKER_HOST=${process.env.DOCKER_HOST}`);
  core.info(`DOCKER_CERT_PATH=${process.env.DOCKER_CERT_PATH || ""}`);
  core.info(`DOCKER_TLS_VERIFY=${process.env.DOCKER_TLS_VERIFY || ""}`);

  core.info("Remote Docker setup complete");
}

async function waitSidecarStarted() {
  const artifact = new DefaultArtifactClient();
  const maxAttempts = 30;
  let attempt = 0;
  let sidecarStarted = false;
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

  return sidecarStarted;
}

async function setupDockerCertificates() {
  const artifact = new DefaultArtifactClient();
  const dockerCertsName = "docker-certs";
  const certsInfo = await artifact.getArtifact(dockerCertsName);
  if (!certsInfo.artifact.id) {
    throw new Error("Failed to find Docker certificates in artifacts");
  }

  const certs = await artifact.downloadArtifact(
    certsInfo.artifact.id,
    { path: "." },
  );

  if (!certs.downloadPath) {
    throw new Error("Failed to download Docker certificates");
  }

  // The certificates are encrypted, decrypt and untar.
  const encryptedFile = path.join(".", `client-certs.enc`);
  const decryptedFile = "client-certs.tar";

  try {
    // Decrypt the file using OpenSSL with GitHub token as key
    const encryptKey = core.getInput("certificates-encryption-key");
    await exec.exec("openssl", [
      "enc",
      "-d",
      "-aes-256-cbc",
      "-in", encryptedFile,
      "-out", decryptedFile,
      "-k", encryptKey,
      "-pbkdf2",
    ]);

    // Extract the decrypted tar file
    fs.mkdirSync(dockerCertsName);
    await exec.exec("tar", [
      "-C", dockerCertsName,
      "-xf", decryptedFile,
    ]);

    // Clean up intermediate files
    fs.unlinkSync(decryptedFile);
    fs.unlinkSync(encryptedFile);
  } catch (error) {
    throw new Error(`Failed to process Docker certificates: ${error.message}`);
  }

  // Set certificates path.
  return path.join(process.cwd(), dockerCertsName);
}
