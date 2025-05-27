# Docker Sidecar Action Collection

A collection of GitHub Actions that enable Docker functionality on Windows and macOS runners by connecting to a
Linux-based Docker daemon through secure SSH tunneling.

## Overview

This repository contains three complementary GitHub Actions that work together to provide a seamless Docker experience
across different platforms:

1. **[Run Sidecar](./run-sidecar)**: Sets up a secure Docker daemon on a Linux runner with SSH access
2. **[Set up Remote Docker](./setup-remote-docker)**: Connects Windows/macOS runners to the remote Docker daemon

These actions solve common challenges when working with Docker in GitHub Actions workflows, especially on Windows and
macOS runners where Docker functionality may be limited or unavailable.

## Key Features

- 🌐 **Cross-Platform Support**: Run Docker workloads on Windows and macOS runners
- 🔒 **Secure by Default**: TLS encryption and SSH tunneling for secure connections
- 📁 **File Sharing**: SMB-based file sharing for Docker volume mounts
- 🔄 **Seamless Integration**: Works with standard Docker CLI commands
- 🛠️ **Flexible Configuration**: Customizable to fit various workflow requirements

## Quick Start

Here's a basic example of how to use these actions together:

```yaml
jobs:
  # Set up Docker daemon on Linux runner
  linux-sidecar:
    needs: [ generate-ssh-key ]
    runs-on: ubuntu-latest
    steps:
      - name: Run Docker sidecar
        uses: lexbritvin/docker-sidecar-action/run-sidecar@v1
        with:
          ssh-server-authorized-keys: ${{ secrets.ssh-public-key }}

  # Use Docker on Windows runner
  windows-job:
    runs-on: windows-latest
    steps:
      - name: Set up Remote Docker
        uses: lexbritvin/docker-sidecar-action/setup-remote-docker@v1
        with:
          private-key: ${{ secrets.ssh-private-key }}
          use-remote-share: 'true'

      - name: Run Docker commands
        run: |
          PATH_PREFIX=""
          if [[ "$RUNNER_OS" == "Windows" ]]; then
              export MSYS_NO_PATHCONV=1
              PATH_PREFIX="/mnt"
          fi
          docker run hello-world
          docker run --rm -v "$PATH_PREFIX$(pwd):/workspace" alpine ls /workspace
```

## Detailed Documentation

Each action has its own detailed documentation:

- **[Run Sidecar](./run-sidecar/README.md)**: Set up a secure Docker daemon on Linux
- **[Setup Remote Docker](./setup-remote-docker/README.md)**: Connect to the Docker daemon from Windows/macOS

## Use Cases

- **Cross-Platform Testing**: Test your application on multiple platforms with consistent Docker support
- **Windows/macOS CI**: Run Docker-based CI workflows on Windows and macOS runners
- **Complex Build Environments**: Set up sophisticated build environments with Docker on any platform
- **File Sharing**: Share files between the host runner and Docker containers

## Example Workflow

See the [example workflow](./.github/workflows/docker-workflow-example.yaml) for a complete demonstration of how these
actions work together.

## License

This project is licensed under the terms of the [LICENSE](./LICENSE) file included in this repository.

---

**⭐ Star this repo if you find it useful!**

Made with ❤️ for the GitHub Actions community
