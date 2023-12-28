/**
 * This function takes a list of objects, each objects having a date property
 * list[dateProp]. It will add usefull date label objects like so:
 * { id: 1, type: label, text: "Today" }
 *
 * `inputList` is not modified
 */
import get from 'lodash/get';
import {
  isSameDay,
  isSameWeek,
  isSameMonth,
  isSameYear,
  getYear,
  format,
} from 'date-fns';

import parseDate from './parseDate';
import sortListByDate from './sortListByDate';

let usedLabels = [];

export default function (inputList, dateProp = 'created', asc = false) {
  if (!inputList) return [];

  // Create a copy of the list that is sorted by date
  const list = sortListByDate(inputList, dateProp, asc);

  // looping over the sorted list and adding labels
  usedLabels = [];
  for (let i = 0; i < list.length; i++) {
    const date = parseDate(get(list[i], dateProp));
    if (!date) continue;
    const now = new Date();

    // Today
    if (isSameDay(date, now)) {
      addLabelIfUnused(list, i, 'Today');
    }

    // This week
    else if (isSameWeek(date, now) && !isSameDay(date, now)) {
      addLabelIfUnused(list, i, 'This Week');
    }

    // This month
    else if (isSameMonth(date, now) && !isSameWeek(date, now)) {
      addLabelIfUnused(list, i, 'This Month');
    }

    // Month
    else if (isSameYear(date, now) && !isSameMonth(date, now)) {
      addLabelIfUnused(list, i, format(date, 'MMMM'));
    }

    // Year
    else if (!isSameYear(date, now)) {
      addLabelIfUnused(list, i, getYear(date));
    }
  }

  return list;
}

function addLabelIfUnused(list, i, label) {
  if (usedLabels.includes(label)) return;
  usedLabels.push(label);
  list.splice(i, 0, {
    id: 'l' + usedLabels.length,
    type: 'label',
    text: label,
  });
  i++;
}
