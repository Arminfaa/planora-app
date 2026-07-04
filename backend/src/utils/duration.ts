const MULTIPLIERS: Record<string, number> = {
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

export function parseDurationToMs(duration: string): number {
  const match = /^(\d+)([smhd])$/.exec(duration.trim());
  if (!match) {
    return 15 * 60_000;
  }

  const value = Number(match[1]);
  const unit = match[2];
  return value * (MULTIPLIERS[unit] ?? MULTIPLIERS.m);
}
