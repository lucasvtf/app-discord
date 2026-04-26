export function formatDuration(ms) {
  if (!ms || ms < 0) return '0s';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`;
  return `${s}s`;
}

export function padTable(rows, headers) {
  const all = [headers, ...rows].map((row) => row.map((cell) => String(cell)));
  const widths = headers.map((_, i) => Math.max(...all.map((row) => row[i].length)));
  const renderRow = (row) =>
    row.map((cell, i) => (i === 0 ? cell.padStart(widths[i]) : cell.padEnd(widths[i]))).join('  ');
  return [renderRow(all[0]), ...all.slice(1).map(renderRow)].join('\n');
}
