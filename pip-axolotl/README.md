# pip-axolotl

A small Claude Code mod that greets you with Pip, a pixel-art axolotl, and Nemo, a nautilus.
When a session starts, they swim in a looping animation in a strip just above the prompt for up to a
minute: Pip's gills flick and Pip blinks, Nemo bobs and wiggles its tentacles, and
bubbles drift up. The strip hides as soon as you send a prompt. Type `/pip` to replay it. Needs a terminal at least 45 columns wide.

It also adds a usage strip to the status line at the bottom: context window fill (tokens used of
the window), each plan limit window (5-hour, 7-day) with percent used and time until it renews,
refreshed after every turn and every 30 seconds. Off a subscription it shows the session's
estimated cost instead.
