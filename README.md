# claude-mods

Mods for [Claude Code](https://claude.com/claude-code).

## pip-axolotl 🌸

Pip, a pixel-art axolotl, and Nemo, a nautilus, swim in a looping animation just above the prompt
when a session starts (gills flick, Pip blinks, Nemo bobs, bubbles rise). The strip hides as soon as
you send a message; `/pip` replays it.

It also adds a usage strip to the status line:

```
🧠 ctx 42% (84k/200k)  │  ⏳ 5h 23% · renews in 2h14m  │  ⏳ 7d 9.5% · renews in 3d12h
```

context window fill, each plan limit window with percent used and time until it renews (refreshed after
every turn and every 30 s). Off a subscription it shows the session's estimated cost instead. `/pipusage`
prints the line on demand.

### Install

At the prompt of a Claude Code terminal session:

```
/plugin install pip-axolotl --marketplace arorarishi/claude-mods
```

Answer `y` to add the marketplace, then pick a scope (user scope is first; press Enter).

From a shell:

```
claude plugin install pip-axolotl --marketplace arorarishi/claude-mods
```

In the desktop app: click **+** next to the prompt box → **Plugins** → **Add marketplace** with
`arorarishi/claude-mods` → **Add plugin**.

## wsl-greeter 🖥️

The same characters as a login greeter for WSL / Linux bash: an animated Pip & Nemo with a greeting,
date, system info and a coding tip each time you open a terminal. Not a Claude Code mod; install with:

```bash
git clone https://github.com/arorarishi/claude-mods.git
bash claude-mods/wsl-greeter/install.sh
```

See [wsl-greeter/README.md](wsl-greeter/README.md).

## License

MIT
