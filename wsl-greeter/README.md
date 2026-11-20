# wsl-greeter

Pip the axolotl and Nemo the nautilus greet you, in animated pixel art, each time you open a
WSL (or any Linux bash) terminal: Pip's gills flick and Pip blinks, Nemo bobs, bubbles rise, then
they settle beside a time-of-day greeting, the date, your kernel and distro, and a random coding tip.

Needs `python3` and a terminal with 24-bit colour and block characters (Windows Terminal with
Cascadia works). Press Ctrl+C to skip the animation; `export PIP_NO_ANIM=1` turns it off.

## Install

```bash
git clone https://github.com/arorarishi/claude-mods.git
bash claude-mods/wsl-greeter/install.sh
```

To uninstall, delete the `# Pip greeter` lines from `~/.bashrc` and remove `~/.wsl_greeter.py`.
