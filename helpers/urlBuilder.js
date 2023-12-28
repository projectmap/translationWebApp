import isString from 'lodash/isString';
import isNumber from 'lodash/isNumber';
import isObject from 'lodash/isObject';
import isEmpty from 'lodash/isEmpty';

/*
 * test for valid values
 */
const valid = (value) => value && (isString(value) || isNumber(value));

/*
 * Generate urls for the editor
 * /translate/de/cch/chapter/1/paragraph/1/
 *
 * Note:
 *  - Does not check for validity of input, e.g. "can chapter be string?"
 */
function urlBuilder(language, abbr = null, chapter = null, p = null) {
  abbr = valid(abbr) ? abbr.toLowerCase().replace(' ', '') : null;

  if (!valid(language)) return '/translate/';
  else if (!valid(abbr)) return `/translate/${language}/`;
  else if (!valid(chapter)) return `/translate/${language}/${abbr}/`;
  else if (!valid(p))
    return `/translate/${language}/${abbr}/chapter/${chapter}/`;
  else
    return `/translate/${language}/${abbr}/chapter/${chapter}/paragraph/${p}/`;
}

/*
 * Generate editor urls from a segment object
 */
export function segmentUrl(language, segment) {
  if (!valid(language) || !isObject(segment) || isEmpty(segment)) return '';
  return urlBuilder(
    language,
    segment.workAbbreviation,
    segment.chapter,
    segment.chapterPosition
  );
}

function ensureTrailingSlash(url) {
  if (url.charAt(url.length - 1) !== '/') {
    return url + '/';
  }
  return url;
}

export function joinURLSegments(baseUrl, endpoints) {
  let url = ensureTrailingSlash(baseUrl);

  if (endpoints && endpoints.length > 0) {
    const joinedEndpoints = endpoints.map((endpoint) =>
      endpoint.replace(/^\/|\/$/g, '')
    );
    url += joinedEndpoints.join('/');
  }

  return url;
}

export default urlBuilder;
