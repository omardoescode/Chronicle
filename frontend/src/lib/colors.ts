export const BASE_COLORS = [
  'chart-1',
  'chart-2',
  'chart-3',
  'chart-4',
  'chart-5',
  'violet',
  'indigo',
  'fuchsia',
  'lime',
  'sky',
  'pink',
  'rose',
  'teal',
  'amber',
  'emerald',
  'blue',
  'cyan',
]

export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
