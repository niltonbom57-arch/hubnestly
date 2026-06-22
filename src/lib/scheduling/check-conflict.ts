export interface TimeRange {
  startAt: Date
  endAt: Date
  teamId?: string | null
}

export function hasConflict(
  candidate: { startAt: Date; endAt: Date },
  blocks: TimeRange[],
  teamId: string,
): boolean {
  return blocks.some(
    (block) =>
      block.teamId === teamId &&
      candidate.startAt < block.endAt &&
      candidate.endAt > block.startAt,
  )
}
