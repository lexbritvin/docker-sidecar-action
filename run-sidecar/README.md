# Secure Docker Remote Access

Sets up secure remote Docker daemon access through SSH tunneling with TLS authentication. This action runs a Docker
daemon on a Linux runner and makes it accessible remotely through a secure SSH tunnel.

## Features

- 🔒 **Secure by Default**: TLS encryption for Docker daemon communication
- 🔑 **SSH Tunneling**: Secure access through SSH with jump host support
- 🌐 **Remote Accessibility**: Access Docker from Windows and macOS runners
- 🔄 **Flexible Configuration**: Customizable SSH and TLS settings
- 📦 **Artifact Generation**: Produces connection artifacts for client setup

## Usage

```yaml
- name: Run Docker sidecar
  uses: lexbritvin/docker-sidecar-action/run-sidecar@main
  with:
    ssh-server-authorized-keys: ${{ needs.generate-ssh-key.outputs.public-key }}
    ssh-jump-host: 'ssh-j.com'  # Optional jump host
    ssh-jump-user: ':generate'   # Generate unique username
    ssh-jump-forward: ':generate'  # Use hostname alias
```

## Inputs

### SSH Server Configuration

| Input                        | Description                                   | Required | Default       |
|------------------------------|-----------------------------------------------|----------|---------------|
| `ssh-server-host`            | SSH server hostname or IP address             | No       | Auto-detected |
| `ssh-server-port`            | SSH server port                               | No       | `2222`        |
| `ssh-server-user`            | SSH username                                  | No       | Current user  |
| `ssh-server-authorized-keys` | Authorized public keys for SSH authentication | No       |               |

### Jump Host Configuration

| Input                       | Description                                | Required | Default |
|-----------------------------|--------------------------------------------|----------|---------|
| `ssh-jump-host`             | SSH jump host server                       | No       |         |
| `ssh-jump-port`             | SSH jump host port                         | No       | `22`    |
| `ssh-jump-user`             | SSH jump host username                     | No       |         |
| `ssh-jump-forward`          | Port forwarding configuration              | No       |         |
| `ssh-jump-private-key`      | Private key for jump host authentication   | No       |         |
| `ssh-jump-private-key-path` | Private key path for jump host             | No       |         |
| `ssh-jump-host-keys`        | SSH host keys for jump server verification | No       |         |
| `ssh-jump-extra-flags`      | Additional SSH flags                       | No       |         |

### Docker TLS Configuration

| Input                     | Description                  | Required | Default     |
|---------------------------|------------------------------|----------|-------------|
| `enable-tls`              | Enable TLS encryption        | No       | `true`      |
| `tls-certificate-domains` | Domains for TLS certificates | No       | `localhost` |

### Output Configuration

| Input                             | Description                          | Required | Default               |
|-----------------------------------|--------------------------------------|----------|-----------------------|
| `docker-connection-artifact-name` | Name for Docker connection artifacts | No       | `docker-conn-details` |

## Outputs

- **Docker connection artifacts**: Contains all necessary files for connecting to the Docker daemon
- **SSH connection details**: Information for establishing SSH tunnels

## Example

```yaml
jobs:
  docker-sidecar:
    needs: [ generate-ssh-key ]
    runs-on: ubuntu-latest
    steps:
      - name: Run Docker sidecar
        uses: lexbritvin/docker-sidecar-action/run-sidecar@main
        with:
          ssh-server-authorized-keys: ${{ secret.ssh-public-key }}
```

## Security Considerations

- TLS encryption is enabled by default for secure Docker daemon communication
- SSH keys should be generated securely and kept private
- Connection artifacts contain sensitive information and should be handled securely

## Related Actions

- [setup-remote-docker](../setup-remote-docker): Connect to the Docker daemon from Windows/macOS runners
