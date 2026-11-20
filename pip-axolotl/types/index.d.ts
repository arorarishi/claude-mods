declare module 'claude-code' {
  interface PluginState {
    'pip-axolotl': { frame: number; isShown: boolean }
  }
}
export type PipFrame = number
