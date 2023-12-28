import { parseISO, isDate } from 'date-fns';

export default function (input) {
  // test for empty input
  if (!input) return null;

  // parse ISO
  const date = isDate(input) ? input : parseISO(input);

  // test for invalid date
  if (date instanceof Date && isNaN(date)) return null;

  return date;
}
