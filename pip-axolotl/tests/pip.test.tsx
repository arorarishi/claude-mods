import { expect, test } from 'claude-code/testing'

const BAND = {
  plugin: 'pip-axolotl',
  component: 'AbovePrompt',
  props: {
    hasSurvey: false, isCollapsed: false, isWorking: false,
    maxRows: 20, bodyColumns: 100,
    scroll: { offset: 0, bodyRows: 20 }, view: {},
  },
} as const

test('Pip shows above the prompt at session start, and hides after a prompt', async ($, on) => {
  on('command.register', () => ({ value: { command: 'pip' } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('prompt.submit', (_, e) => ({ text: e.text }))
  on('clock.every', () => ({ value: undefined }))
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })

  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect((await ui.find({ type: 'Text', text: /Pip & Nemo/ }))?.text).toContain('Pip & Nemo say hi')
  await ui.unmount()

  await $.prompt.submit({ text: 'hello' } as never)
  const after = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect((await after.find({ type: 'Text', text: /engine/ }))?.text).toBe('engine')
  await after.unmount()
})

test('a narrow terminal leaves the band to the engine', async ($, on) => {
  on('command.register', () => ({ value: { command: 'pip' } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  const ui = await $.ui.mount({ ...BAND, props: { ...BAND.props, bodyColumns: 30 }, surface: 'terminal' })
  expect((await ui.find({ type: 'Text', text: /engine/ }))?.text).toBe('engine')
  await ui.unmount()
})

test('the status strip shows context, plan windows and the renewal countdown', async ($, on) => {
  const now = Date.parse('2026-11-20T15:00:00Z')
  const shown: Array<string | undefined> = []
  on('command.register', () => ({ value: { command: 'pip' } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('clock.every', () => ({ value: undefined }))
  on('clock.now', () => ({ value: now }))
  on('session.usage', () => ({
    value: {
      startedAt: now,
      context: { tokens: 84_000, window: 200_000, percent: 42 },
      rateLimits: [
        { kind: 'five_hour', percentUsed: 23, resetsAt: '2026-11-20T17:14:00Z' },
        { kind: 'seven_day', percentUsed: 9.5, resetsAt: '2026-11-24T03:00:00Z' },
      ],
      cost: { usd: 1.234 },
    },
  }))
  on('ui.status', (_, e) => { shown.push((e as { text?: string }).text); return { value: undefined } })

  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: false })
  expect(shown.at(-1)).toBe('🧠 ctx 42% (84k/200k)  │  ⏳ 5h 23% · renews in 2h14m  │  ⏳ 7d 9.5% · renews in 3d12h')
})
