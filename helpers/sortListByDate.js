/**
 * takes an `inputList` and sorts it by a date property `item[dateProp]`
 *
 * `inputList` is not modified
 */
import get from 'lodash/get';
import has from 'lodash/has';
import isArray from 'lodash/isArray';
import { compareDesc } from 'date-fns';
import parseDate from './parseDate';

export default function (inputList, dateProp = 'created', asc = false) {
  if (!inputList) return null;

  // validate inputList
  if (!isArray(inputList)) throw new Error('input list is not an array');

  // validate dateProp
  if (inputList.length && !has(inputList[0], dateProp))
    throw new Error('date property not present in list objects');

  // Create a copy of the list that is sorted by date
  const list = inputList
    .slice()
    .sort((a, b) =>
      compareDesc(parseDate(get(a, dateProp)), parseDate(get(b, dateProp)))
    );

  // reverse for ascending order
  if (asc) list.reverse();

  return list;
}
