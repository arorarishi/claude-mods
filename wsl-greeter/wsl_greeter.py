#!/usr/bin/env python3
"""Pip the axolotl + Nemo the nautilus: animated pixel-art greeter for WSL login.
Set PIP_NO_ANIM=1 to skip the animation and show only the final frame."""
import os, random, sys, time, datetime, platform

COL = {'G':(235,80,140),'g':(200,55,115),'P':(255,170,200),'p':(240,140,175),'E':(45,30,40),
       'K':(255,110,140),'M':(150,60,90),'S':(250,235,215),'O':(205,105,55),'C':(120,60,40),
       'H':(235,155,120),'h':(205,120,90),'T':(245,180,150),'B':(170,215,255)}

AXO = ["GG..................GG", ".gG...PPPPPPPPPP...Gg.", "...gGPPPPPPPPPPPPGg...",
       "GGGgPPPPPPPPPPPPPPgGGG", "...gPEEPPPPPPPPEEPg...", "..gGPEEPPPPPPPPEEPGg..",
       "Gg..PKKPPPMMPPPKKP..gG", "....pPPPPPPPPPPPPp....", ".....pPPPPPPPPPPp.pPP.",
       ".....PPPPPPPPPPPPPPp..", "....PPp.pPPPPp.PPp....", "....pp..........pp...."]
# alternate gill pose (fronds flick)
GILLS_B = {0:".GG................GG.", 1:"..gG..PPPPPPPPPP..Gg..", 3:".GGgPPPPPPPPPPPPPPgGG.",
           4:"G..gPEEPPPPPPPPEEPg..G", 6:".Gg.PKKPPPMMPPPKKP.gG."}
NAU = ["....OOOOOO.....", "..OOSSSSSSOO...", ".OSSOOOOOOSSO..", ".OSOSSSSSSOSSO.",
       "OSOSSOOOSSSOSO.", "OSOSOSSCOSSOSO.", "hSOSOSSSSSOSSO.", "HHSOSOOOOOSSO..",
       "EHHSOSSSSSSO...", "HHHHSOOOOOO....", "THTHH..........", "T.T.T.........."]
NAU_TENT_B = {10:"THTHH..........", 11:".T.T.T........."}

GAP, H = 5, 14                        # 14 pixel rows = 7 text lines
W = len(AXO[0]) + GAP + len(NAU[0])
NX = len(AXO[0]) + GAP

def put(grid, x, y, s):
    if 0 <= y < H:
        for i, c in enumerate(s):
            if c != '.' and 0 <= x + i < W:
                grid[y][x + i] = c

def set_eyes(rows, kind):
    def eye(r, a, b):
        rows[r] = rows[r][:5] + a + rows[r][7:15] + b + rows[r][17:]
    if kind == "closed":            eye(4, "PP", "PP"); eye(5, "EE", "EE")
    elif kind == "happy":           eye(4, "PP", "PP"); eye(5, "EE", "EE"); rows[4] = rows[4][:4]+"P"+rows[4][5:]
    elif kind == "wink":            eye(4, "EE", "PP"); eye(5, "EE", "EE")

BUBBLES = [(NX - 3, 3), (NX - 2, 9), (NX + 13, 6), (2 + NX // 2, 12)]

def frame(f, expr, final=False):
    g = [['.'] * W for _ in range(H)]
    axo = list(AXO)
    if not final and (f // 2) % 2:
        for r, s in GILLS_B.items(): axo[r] = s
    set_eyes(axo, "closed" if (not final and f in (9, 10)) else expr)
    for y, s in enumerate(axo): put(g, 0, y + 1, s)
    nau = list(NAU)
    if not final and (f // 2) % 2:
        for r, s in NAU_TENT_B.items(): nau[r] = s
    bob = 0 if final else (1 if (f // 3) % 2 else 0)
    for y, s in enumerate(nau): put(g, NX, y + bob + (1 if final else 0) - (0 if final else 0), s)
    if not final:
        for x, y0 in BUBBLES:
            y = (y0 - f) % H
            if g[y][x] == '.': g[y][x] = 'B'
    return g

def esc(c, bg=False):
    r, gg, b = COL[c]; return f"\x1b[{48 if bg else 38};2;{r};{gg};{b}m"

def render(g):
    lines = []
    for r in range(0, H, 2):
        out = []
        for t, b in zip(g[r], g[r + 1]):
            if t != '.' and b != '.': out.append(esc(t) + esc(b, True) + "▀\x1b[0m")
            elif t != '.':            out.append(esc(t) + "▀\x1b[0m")
            elif b != '.':            out.append(esc(b) + "▄\x1b[0m")
            else:                     out.append(" ")
        lines.append("".join(out))
    return lines

def side_text():
    D, Wt, R = "\x1b[38;2;140;120;130m", "\x1b[1;97m", "\x1b[0m"
    h = datetime.datetime.now().hour
    hello = ("Burning the midnight oil?" if h < 5 else "Good morning!" if h < 12 else
             "Good afternoon!" if h < 17 else "Good evening!" if h < 21 else "Late-night hacking, nice.")
    try:
        osname = next(l.split("=", 1)[1].strip().strip('"') for l in open("/etc/os-release") if l.startswith("PRETTY_NAME"))
    except Exception:
        osname = "Linux"
    user = os.environ.get("USER", "you")
    return ["", Wt + hello + R, D + f"Pip the axolotl & Nemo the nautilus say hi, {user}." + R,
            D + datetime.datetime.now().strftime("%a %d %b %Y · %H:%M") + R,
            D + platform.release().split("-")[0] + " · " + osname + R, "", ""]

TIPS = ["Small commits, big wins.", "Read the error message twice — it usually knows.",
        "git stash is a time machine for the impatient.", "Name things well; future you is reading.",
        "Tests are love letters to your future self.",
        "Axolotls regrow limbs. You can regrow a branch: git reflog.",
        "Ctrl+R searches your shell history.",
        "Nautiluses have been around 500M years. Legacy code is fine."]

def draw(lines, side, first):
    out = "" if first else f"\x1b[{len(lines)}A"
    for l, s in zip(lines, side):
        out += f"\r   {l}    {s}\x1b[K\n"
    sys.stdout.write(out); sys.stdout.flush()

def main():
    expr = random.choice(["open", "open", "happy", "wink"])
    side = side_text()
    animate = sys.stdout.isatty() and not os.environ.get("PIP_NO_ANIM")
    print()
    try:
        if animate:
            sys.stdout.write("\x1b[?25l")
            for f in range(18):
                draw(render(frame(f, expr)), side, f == 0)
                time.sleep(0.09)
        draw(render(frame(0, expr, final=True)), side, not animate)
    except KeyboardInterrupt:
        draw(render(frame(0, expr, final=True)), side, False)
    finally:
        if animate: sys.stdout.write("\x1b[?25h")
    tip = random.choice(TIPS)
    print(f"   \x1b[38;2;235;80;140mtip:\x1b[0m {tip}\n")

if __name__ == "__main__":
    main()
