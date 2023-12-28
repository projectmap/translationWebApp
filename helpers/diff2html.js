import bubbleSort from 'js-sorting/lib/bubble-sort';
import findIndex from 'lodash/findIndex';
import first from 'lodash/first';
import compact from 'lodash/compact';
import clone from 'lodash/clone';
import cloneDeep from 'lodash/cloneDeep';
import flatten from 'lodash/flatten';
import startsWith from 'lodash/startsWith';
import get from 'lodash/get';

/**
 * Use the opening and closing HTML tags for formatting (<strong>, <em>, ...)
 * and wrap them around each word individually
 */
export function handleFormatting(json) {
  if (!json) return [];

  const tokens = cloneDeep(json);

  // First stage: Split any tokens where HTML and words are combined
  for (let i = 0; i < tokens.length - 1; i++) {
    const token = tokens[i];

    // Split strings
    let split = token.value.split('<');
    split = split.map((str, j) => {
      if (j > 0) str = `<${str}`;
      return str
        .split('>')
        .map((str, i, arr) => (i < arr.length - 1 ? `${str}>` : str));
    });
    split = compact(flatten(split));

    // Duplicate tokens
    tokens.splice(i, 1);
    for (const str of split) {
      tokens.splice(i++, 0, { ...token, value: str, count: 1 });
    }
    i--;
  }

  // Second stage: Iterate tokens and apply tags
  const tags = [];
  for (let i = 0; i < tokens.length - 1; i++) {
    const token = tokens[i];

    // Remember active HTML tags
    if ((token.added || token.removed) && /<.+>/.test(token.value)) {
      const tag = first(token.value.match(/<[^>]+>/));
      if (!startsWith(tag, '</')) {
        // Add opening html tags
        tags.push({
          value: tag,
          added: token.added,
          removed: token.removed,
        });
      } else {
        // Remove closing html tags
        const name = first(tag.match(/\w+/));
        const n = findIndex(
          tags,
          ({ value }) => name === first(value.match(/\w+/))
        );
        tags.splice(n, 1);
      }

      tokens[i] = null;
    }

    // Apply active HTML tags to tokens
    if (tags.length && !/<.+>/.test(token.value)) {
      if (token.added) {
        applyTags(tags, token, 'added');
      } else if (token.removed) {
        applyTags(tags, token, 'removed');
      } else {
        // Create replacement tokens
        const added = {
          ...applyTags(tags, clone(token), 'added'),
          added: true,
        };
        const removed = {
          ...applyTags(tags, clone(token), 'removed'),
          removed: true,
        };

        // Replace the new added and removed for the old token
        tokens.splice(i, 1, added);
        tokens.splice(i, 0, removed);
        i++;
      }
    }
  }

  return compact(tokens);
}

/**
 * Helper function for handleFormatting()
 */
function applyTags(tags, token, action) {
  for (const tag of tags) {
    if (action && !get(tag, action)) continue;
    const closingTag = `</${first(tag.value.match(/\w+/))}>`;
    token.value = tag.value + token.value + closingTag;
    token.count += 2;
  }
  return token;
}

/**
 * Clean up the output of jsdiff
 */
export function cleanDiff(diff) {
  // bail early
  if (!diff) return [];

  // remove whitespace
  diff = diff.filter((a) => {
    return a.value.trim().length;
  });

  // use a stable sort algorithm to arrange multiple-words-in-a-row
  // changes better
  bubbleSort(diff, (a, b) => {
    return a.added === true && b.removed === true ? 1 : 0;
  });

  // collapse operations of the same kind, which are now right next to
  // each other thanks to bubbleSort
  diff.forEach((val, i) => {
    if (i === 0 || !val) return;
    if (
      (diff[i - 1].added && diff[i].added) ||
      (diff[i - 1].removed && diff[i].removed)
    ) {
      diff[i].value = (diff[i - 1].value + ' ' + diff[i].value).trim();
      diff[i - 1] = null;
    }
  });
  diff = diff.filter((a) => a);

  return diff;
}

/**
 * Renders the output of jsdiff in nice HTML
 */
export function json2html(json) {
  let html = '';
  for (const obj of json) {
    if (!obj) continue;
    let state = '';
    if (obj.added === true) state = 'added';
    if (obj.removed === true) state = 'removed';
    html += ` <span class="${state}">${obj.value}</span>`;
  }
  return html;
}

export default function (diffJson) {
  const formattedJson = handleFormatting(diffJson);
  const cleanedJson = cleanDiff(formattedJson);
  const html = json2html(cleanedJson);
  return html;
}
