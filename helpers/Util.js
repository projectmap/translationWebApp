import isBefore from 'date-fns/isBefore';
import isArray from 'lodash/isArray';
import diffFormattedWords from './diffFormattedWords';
import diff2html from './diff2html';

// await (ms => new Promise(resolve => setTimeout(resolve, ms)))(2000);

export function parseParameter(key, url) {
  if (!url) url = window.location.href;
  key = key.replace(/[[\]]/g, '\\$&');
  const regex = new RegExp('[?&]' + key + '(=([^&#]*)|&|#|$)');
  const results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

/**
 * Scrolls a container to the bottom
 * Waits one tick for vue to update it's stuff first
 */
export function scrollTo(instance, element, position = 'bottom') {
  instance.$nextTick(() => {
    element.scrollTop =
      position === 'bottom' ? element.scrollHeight - element.clientHeight : 0;
  });
}

export function segmentWasModified(segment) {
  return (
    typeof segment !== 'undefined' &&
    typeof segment.created !== 'undefined' &&
    typeof segment.lastModified !== 'undefined' &&
    isBefore(segment.created, segment.lastModified)
  );
}

export function keyInArray(array, key) {
  return isArray(array) && array.length && typeof array[key] !== 'undefined';
}

export function singularPlural(count, singular, plural) {
  return `${count === 1 ? 'One' : count || 'No'} ${
    count === 1 ? singular : plural
  }`;
}

/*
 * url without /api/ prefix
 */
export function cleanUrl(url) {
  return url.replace(/^\/api\//, '');
}

/*
 * url without /api/ prefix and parameters
 */
export function cleanerUrl(url) {
  if (url) {
    return cleanUrl(url).split('?')[0];
  }
}

export function setCaretAtEnd(element) {
  element.focus();
  if (window.getSelection && document.createRange) {
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    const selection = window.getSelection();
    selection.removeAllRanges();
    return selection.addRange(range);
  } else if (document.body.createTextRange) {
    const textRange = document.body.createTextRange();
    textRange.moveToElementText(element);
    textRange.collapse(false);
    return textRange.select();
  }
}

export function diff(oldText, newText) {
  const strip = (str) => str.replace(/&nbsp;/gi, ''); // strip &nbsp;
  return diff2html(diffFormattedWords(strip(oldText), strip(newText)));
}

export const stripHTML = (content) => {
  return content?.toString().replace(/<[^>]*>/g, ' ');
};

export function isElementPartiallyInViewport(el) {
  if (process.server) return false;
  const rect = el.getBoundingClientRect();
  // DOMRect { x: 8, y: 8, width: 100, height: 100, top: 8, right: 108, bottom: 108, left: 8 }
  const windowHeight =
    window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;

  // http://stackoverflow.com/questions/325933/determine-whether-two-date-ranges-overlap
  const vertInView = rect.top <= windowHeight && rect.top + rect.height >= 0;
  const horInView = rect.left <= windowWidth && rect.left + rect.width >= 0;

  return vertInView && horInView;
}

export function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function timeSince(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);

  let interval = seconds / 31536000;

  if (interval > 1) {
    return Math.floor(interval) + ' years';
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    return Math.floor(interval) + ' months';
  }
  interval = seconds / 86400;
  if (interval > 1) {
    return Math.floor(interval) + ' days';
  }
  interval = seconds / 3600;
  if (interval > 1) {
    return Math.floor(interval) + ' hours';
  }
  interval = seconds / 60;
  if (interval > 1) {
    return Math.floor(interval) + ' minutes';
  }
  return Math.floor(seconds) + ' seconds';
}

export default {
  parseParameter,
  scrollTo,
  segmentWasModified,
  keyInArray,
  singularPlural,
  diff,
  isElementPartiallyInViewport,
  wait,
  timeSince,
};

// validSessionCookie() {
//     // TODO check if session cookie exiss and is valid
//     return true;
// },
// invalidateSessionCookie() {
//     // TODO invalidate session cookie
// }

/**
 * It takes a word and a length, and returns the word if it's less than or equal to the length,
 * otherwise it returns the word with an ellipsis at the end
 * @param word - The word you want to limit
 * @param length - The length of the word you want to display.
 * @returns the value of the variable displayWord.
 */
export const limitNameWithLength = (word, length) => {
  if (!word) return '';
  if (word && word.length <= length) return word;

  const displayWord = word.substring(0, length);
  return displayWord + '...';
};

/**
 * Transform any given word to camel case
 * @param {string} words
 * @returns
 */
export const camelCase = (words) => {
  if (words) {
    let tempWords = words.split(' ');
    tempWords = tempWords.map((word) =>
      word ? word[0].toUpperCase() + word.slice(1).toLowerCase() : undefined
    );
    return tempWords.join(' ');
  }
  return words;
};

export const disableRightClickOnSiteOnProduction = () => {
  if (process.env.NODE_ENV === 'production') {
    document.addEventListener('contextmenu', function (e) {
      e.preventDefault();
    });
  }
};
