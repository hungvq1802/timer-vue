export function secondsBetween(past: Date, now = new Date()): number {
  const diff = now.getTime() - past.getTime();
  return Math.max(0, Math.floor(diff / 1000));
}

export function formatHMS(total: number): string {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map(v => String(v).padStart(2, "0")).join(":");
}