import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, SessionUsage, Timer } from 'claude-code'

const frameAtom = atom({ plugin: 'pip-axolotl', key: 'frame' } as const, 0)
const shownAtom = atom({ plugin: 'pip-axolotl', key: 'isShown' } as const, false)

const COL: Record<string, string> = {
  G: '#eb508c', g: '#c83773', P: '#ffaac8', p: '#f08caf', E: '#2d1e28', K: '#ff6e8c', M: '#963c5a',
  S: '#faebd7', O: '#cd6937', C: '#783c28', H: '#eb9b78', h: '#cd785a', T: '#f5b496', B: '#aad7ff',
}

const AXO = [
  'GG..................GG', '.gG...PPPPPPPPPP...Gg.', '...gGPPPPPPPPPPPPGg...',
  'GGGgPPPPPPPPPPPPPPgGGG', '...gPEEPPPPPPPPEEPg...', '..gGPEEPPPPPPPPEEPGg..',
  'Gg..PKKPPPMMPPPKKP..gG', '....pPPPPPPPPPPPPp....', '.....pPPPPPPPPPPp.pPP.',
  '.....PPPPPPPPPPPPPPp..', '....PPp.pPPPPp.PPp....', '....pp..........pp....',
]
const GILLS_B: Record<number, string> = {
  0: '.GG................GG.', 1: '..gG..PPPPPPPPPP..Gg..', 3: '.GGgPPPPPPPPPPPPPPgGG.',
  4: 'G..gPEEPPPPPPPPEEPg..G', 6: '.Gg.PKKPPPMMPPPKKP.gG.',
}
const NAU = [
  '....OOOOOO.....', '..OOSSSSSSOO...', '.OSSOOOOOOSSO..', '.OSOSSSSSSOSSO.',
  'OSOSSOOOSSSOSO.', 'OSOSOSSCOSSOSO.', 'hSOSOSSSSSOSSO.', 'HHSOSOOOOOSSO..',
  'EHHSOSSSSSSO...', 'HHHHSOOOOOO....', 'THTHH..........', 'T.T.T..........',
]
const NAU_TENT_B: Record<number, string> = { 11: '.T.T.T.........' }

const GAP = 5
const H = 14
const NX = AXO[0]!.length + GAP
const W = NX + NAU[0]!.length
const FRAMES = 84          // lcm of gill (4), bob (6) and bubble (14) cycles: seamless loop
const TICK_MS = 110
const SHOW_MS = 60000      // Pip swims for a minute (or until you send a prompt)
const BUBBLES: Array<[number, number]> = [[NX - 3, 3], [NX - 2, 9], [NX + 13, 6], [NX - 14, 12]]

function eyes(rows: string[], kind: 'open' | 'closed' | 'wink') {
  const set = (r: number, a: string, b: string) => {
    const row = rows[r]!
    rows[r] = row.slice(0, 5) + a + row.slice(7, 15) + b + row.slice(17)
  }
  if (kind === 'closed') { set(4, 'PP', 'PP'); set(5, 'EE', 'EE') }
  if (kind === 'wink') { set(4, 'EE', 'PP'); set(5, 'EE', 'EE') }
}

function grid(f: number): string[][] {
  const final = f >= FRAMES
  const g = Array.from({ length: H }, () => Array<string>(W).fill('.'))
  const put = (x: number, y: number, s: string) => {
    if (y < 0 || y >= H) return
    for (let i = 0; i < s.length; i++) if (s[i] !== '.' && x + i < W) g[y]![x + i] = s[i]!
  }
  const flick = !final && Math.floor(f / 2) % 2 === 1
  const axo = AXO.map((r, i) => (flick && GILLS_B[i]) || r)
  eyes(axo, final ? 'wink' : [9, 10, 40, 41, 66, 67].includes(f) ? 'closed' : 'open')
  axo.forEach((r, y) => put(0, y + 1, r))
  const bob = final ? 1 : Math.floor(f / 3) % 2
  NAU.forEach((r, y) => put(NX, y + bob, (flick && NAU_TENT_B[y]) || r))
  if (!final) {
    for (const [x, y0] of BUBBLES) {
      const y = (((y0 - f) % H) + H) % H
      if (g[y]![x] === '.') g[y]![x] = 'B'
    }
  }
  return g
}

type Cell = { ch: string; fg?: string; bg?: string }

function lines(f: number): Cell[][] {
  const g = grid(f)
  const out: Cell[][] = []
  for (let r = 0; r < H; r += 2) {
    const row: Cell[] = []
    for (let x = 0; x < W; x++) {
      const t = g[r]![x]!, b = g[r + 1]![x]!
      if (t !== '.' && b !== '.') row.push({ ch: '▀', fg: COL[t], bg: COL[b] })
      else if (t !== '.') row.push({ ch: '▀', fg: COL[t] })
      else if (b !== '.') row.push({ ch: '▄', fg: COL[b] })
      else row.push({ ch: ' ' })
    }
    // merge runs with the same colours to keep the tree small
    const merged: Cell[] = []
    for (const c of row) {
      const last = merged[merged.length - 1]
      if (last && last.fg === c.fg && last.bg === c.bg) last.ch += c.ch
      else merged.push({ ...c })
    }
    out.push(merged)
  }
  return out
}

const SIDE = ['', 'Pip & Nemo say hi!', '', '', '', '', '']

let stop: Timer | undefined
let hide: Timer | undefined

function halt() {
  stop?.cancel()
  hide?.cancel()
  stop = hide = undefined
}

async function play($: EngineInterface) {
  halt()
  await update($, frameAtom, () => 0)
  await update($, shownAtom, () => true)
  // loop the animation for as long as Pip is shown
  stop = $.clock.every(TICK_MS, () => {
    void update($, frameAtom, f => (f + 1) % FRAMES)
  })
  hide = $.clock.after(SHOW_MS, () => {
    halt()
    void update($, shownAtom, () => false)
  })
}

// ---- usage strip (status line): context fill, limit windows, reset countdown ----
let usageTimer: Timer | undefined

function kTokens(n: number): string {
  return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${Math.round(n / 1000)}k` : `${n}`
}

function countdown(iso: string | undefined, now: number): string {
  if (!iso) return ''
  const ms = Date.parse(iso) - now
  if (!Number.isFinite(ms)) return ''
  if (ms <= 0) return 'resetting'
  const mins = Math.ceil(ms / 60000)
  const d = Math.floor(mins / 1440), h = Math.floor((mins % 1440) / 60), m = mins % 60
  return d > 0 ? `${d}d${h}h` : h > 0 ? `${h}h${String(m).padStart(2, '0')}m` : `${m}m`
}

function formatUsage(u: SessionUsage, now: number): string {
  const parts: string[] = []
  const c = u.context
  if (c.tokens !== undefined) {
    parts.push(`🧠 ctx ${c.percent ?? Math.round((c.tokens / c.window) * 100)}% (${kTokens(c.tokens)}/${kTokens(c.window)})`)
  } else {
    parts.push(`🧠 ctx –/${kTokens(c.window)}`)
  }
  const label: Record<string, string> = { five_hour: '5h', seven_day: '7d', spend_limit: 'spend' }
  for (const r of u.rateLimits) {
    const left = countdown(r.resetsAt, now)
    parts.push(`⏳ ${label[r.kind] ?? r.kind} ${r.percentUsed}%${left ? ` · renews in ${left}` : ''}`)
  }
  // on a subscription usage isn't billed in dollars, so only show cost when there are no plan windows
  if (u.rateLimits.length === 0 && u.cost) parts.push(`💲${u.cost.usd.toFixed(2)} (est.)`)
  return parts.join('  │  ')
}

async function refreshUsage($: EngineInterface) {
  const [u, now] = await Promise.all([$.session.usage(), $.clock.now()])
  $.ui.status(formatUsage(u, now))
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'pip', description: 'Replay the Pip the axolotl animation' })
    await $.command.register({ name: 'pipusage', description: 'Show the usage strip: context, limits and renewal time' })
    const result = await next(e)
    usageTimer?.cancel()
    await refreshUsage($).catch(() => undefined)
    // keep the renewal countdown ticking between turns
    usageTimer = $.clock.every(30_000, () => { void refreshUsage($).catch(() => undefined) })
    if (e.isInteractive) await play($)
    return result
  })

  on('command.run', { command: 'pip' }, async $ => {
    await play($)
    return { text: 'Pip waves hello 🌸' }
  })

  on('command.run', { command: 'pipusage' }, async $ => {
    const [u, now] = await Promise.all([$.session.usage(), $.clock.now()])
    const text = formatUsage(u, now)
    $.ui.status(text)
    return { text }
  })

  on('session.measure', async ($, e, next) => {
    await refreshUsage($).catch(() => undefined)
    return next(e)
  })

  on('prompt.submit', ($, e, next) => {
    halt()
    void update($, shownAtom, () => false).catch(() => undefined)
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey || e.props.isWorking || !(await read($, shownAtom))) return next(e)
    if (e.props.bodyColumns < W + 2 || e.props.maxRows < H / 2) return next(e)
    const f = await read($, frameAtom)
    const { Box, Text } = $.ui.resolve(e)
    return (
      <Box flexDirection="column">
        {lines(f).map((row, i) => (
          <Box key={`r${i}`} flexDirection="row">
            <Text>
              {row.map((c, j) => (
                <Text key={`c${j}`} color={c.fg} backgroundColor={c.bg}>{c.ch}</Text>
              ))}
            </Text>
            <Text weight="bold">{'   ' + (SIDE[i] ?? '')}</Text>
          </Box>
        ))}
      </Box>
    )
  })
}
