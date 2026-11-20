#!/usr/bin/env bash
# Installs the Pip & Nemo login greeter for WSL / Linux bash.
# Usage: bash install.sh      (run from this folder)
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
cp "$here/wsl_greeter.py" "$HOME/.wsl_greeter.py"
line='[[ $- == *i* && -f ~/.wsl_greeter.py ]] && python3 ~/.wsl_greeter.py'
if ! grep -qF '.wsl_greeter.py' "$HOME/.bashrc" 2>/dev/null; then
  cp "$HOME/.bashrc" "$HOME/.bashrc.pre-greeter.bak" 2>/dev/null || true
  printf '\n# Pip greeter (load-screen character)\n%s\n' "$line" >> "$HOME/.bashrc"
  echo "Added the greeter to ~/.bashrc (backup: ~/.bashrc.pre-greeter.bak)."
else
  echo "~/.bashrc already runs the greeter; updated the script only."
fi
echo "Open a new terminal to see Pip. Set PIP_NO_ANIM=1 to skip the animation."
