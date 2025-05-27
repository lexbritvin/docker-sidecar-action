# Set up Remote Docker

Set up a Linux remote Docker for Windows and macOS runners with optional SMB share support. This action connects to a
Docker daemon running on a Linux runner, making Docker available on platforms where it's not natively supported or has
limitations.

## Features

- 🖥️ **Cross-Platform**: Works on Windows and macOS GitHub runners
- 🔄 **Seamless Integration**: Connect to remote Docker daemon with minimal configuration
- 🔒 **Secure Connection**: Uses SSH tunneling with optional TLS encryption
- 📁 **File Sharing**: Optional SMB share for volume mounting between host and container
- 🔌 **Automatic Setup**: Handles all connection details and authentication

## Usage

```yaml
- name: Set up Remote Docker
  uses: lexbritvin/docker-sidecar-action/setup-remote-docker@main
  with:
    private-key: ${{ needs.generate-ssh-key.outputs.private-key }}
    use-remote-share: 'true'  # Enable file sharing
```

## Prerequisites

This action requires a running Docker sidecar on a Linux runner. Use the [run-sidecar](../run-sidecar) action to set up
the Docker daemon first.

## Inputs

| Input                             | Description                                            | Required | Default               |
|-----------------------------------|--------------------------------------------------------|----------|-----------------------|
| `docker-connection-artifact-name` | Name of the Docker connection artifacts to download    | No       | `docker-conn-details` |
| `private-key`                     | SSH private key content for sidecar SSH authentication | No       |                       |
| `private-key-path`                | Path to the SSH private key file                       | No       |                       |
| `use-remote-share`                | Enable SMB share mounting for file sharing             | No       | `false`               |

## Outputs

None. The action sets up the Docker environment for the current job.

## Example Workflow

```yaml
jobs:
  linux-sidecar:
    needs: [ generate-ssh-key ]
    runs-on: ubuntu-latest
    steps:
      - name: Run Docker sidecar
        uses: lexbritvin/docker-sidecar-action/run-sidecar@main
        with:
          ssh-server-authorized-keys: ${{ secrets.ssh-public-key }}

  windows-job:
    runs-on: windows-latest
    steps:
      - name: Set up Remote Docker
        uses: lexbritvin/docker-sidecar-action/setup-remote-docker@main
        with:
          private-key: ${{ secrets.ssh-private-key }}
          use-remote-share: 'true'

      - name: Run Docker container with volume mount
        shell: bash
        run: |
          PATH_PREFIX=""
          if [[ "$RUNNER_OS" == "Windows" ]]; then
              export MSYS_NO_PATHCONV=1
              PATH_PREFIX="/mnt"
          fi
          # Create a test file in the workspace
          echo "Hello from Windows" > test-file.txt

          # Mount the workspace and access the file from the container
          docker run --rm -v "$PATH_PREFIX$(pwd):/workspace" alpine:latest \
            sh -c "cat /workspace/test-file.txt && echo 'Hello from container' >> /workspace/test-file.txt"
```

## How It Works

1. **Docker Client Installation**: Installs Docker client on macOS if needed
2. **SMB Share Configuration**: Sets up SMB share parameters if file sharing is enabled
3. **Connection Setup**: Downloads and processes connection artifacts from the Docker sidecar
4. **TLS Configuration**: Sets up TLS certificates if secure connection is enabled
5. **SSH Tunneling**: Establishes SSH tunnels for Docker and SMB communication
6. **Remote Mount**: Configures SMB mount on the remote host if file sharing is enabled
7. **Verification**: Tests the Docker connection to ensure everything is working

## File Sharing

When `use-remote-share` is enabled, the action:

1. Sets up an SMB share on the Windows or macOS runner
2. Establishes an SSH tunnel for SMB traffic
3. Mounts the share on the Linux runner
4. Allows Docker containers to access files from the host runner

This enables volume mounting with Docker, making local files available to containers.

## Related Actions

- [run-sidecar](../run-sidecar): Set up the Docker daemon on a Linux runner
