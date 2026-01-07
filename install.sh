#!/bin/bash
set -euo pipefail

REPO="camhahu/chief"
BINARY_NAME="chief"
INSTALL_DIR="${HOME}/.local/bin"

detect_os() {
  case "$(uname -s)" in
    Darwin) echo "darwin" ;;
    Linux) echo "linux" ;;
    MINGW*|MSYS*|CYGWIN*) echo "windows" ;;
    *) echo "unsupported" ;;
  esac
}

detect_arch() {
  case "$(uname -m)" in
    x86_64|amd64) echo "x64" ;;
    arm64|aarch64) echo "arm64" ;;
    *) echo "unsupported" ;;
  esac
}

main() {
  local os arch download_url binary_path

  os=$(detect_os)
  arch=$(detect_arch)

  if [ "$os" = "unsupported" ]; then
    echo "Error: Unsupported operating system: $(uname -s)" >&2
    exit 1
  fi

  if [ "$arch" = "unsupported" ]; then
    echo "Error: Unsupported architecture: $(uname -m)" >&2
    exit 1
  fi

  download_url="https://github.com/${REPO}/releases/latest/download/${BINARY_NAME}-${os}-${arch}"

  if [ "$os" = "windows" ]; then
    download_url="${download_url}.exe"
    binary_path="${INSTALL_DIR}/${BINARY_NAME}.exe"
  else
    binary_path="${INSTALL_DIR}/${BINARY_NAME}"
  fi

  mkdir -p "${INSTALL_DIR}"

  if command -v curl &>/dev/null; then
    curl -fsSL "${download_url}" -o "${binary_path}"
  elif command -v wget &>/dev/null; then
    wget -q "${download_url}" -O "${binary_path}"
  else
    echo "Error: curl or wget required" >&2
    exit 1
  fi

  chmod +x "${binary_path}"

  echo "Installed to ${binary_path}"

  if ! echo "${PATH}" | grep -q "${INSTALL_DIR}"; then
    echo
    echo "Add to PATH:"
    echo "  export PATH=\"\${HOME}/.local/bin:\${PATH}\""
  fi
}

main
