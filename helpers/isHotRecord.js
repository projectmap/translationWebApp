import { parseISO, isAfter } from 'date-fns';

export default function (record) {
  return isAfter(parseISO(record?.expires), new Date());
}
