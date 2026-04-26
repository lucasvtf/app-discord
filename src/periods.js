import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import isoWeek from 'dayjs/plugin/isoWeek.js';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isoWeek);

export const PERIODS = ['semana', 'mes', 'tudo'];

export function getRange(period, tz) {
  const now = dayjs().tz(tz);
  const to = now.valueOf();

  if (period === 'semana') {
    const from = now.startOf('isoWeek').valueOf();
    return { from, to, label: `Semana de ${dayjs(from).tz(tz).format('DD/MM')}` };
  }
  if (period === 'mes') {
    const from = now.startOf('month').valueOf();
    return { from, to, label: now.format('MMMM/YYYY') };
  }
  if (period === 'tudo') {
    return { from: 0, to, label: 'Acumulado total' };
  }
  throw new Error(`Periodo invalido: ${period}`);
}
