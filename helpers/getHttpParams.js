import isString from 'lodash/isString';

export default function (inputUrl, key) {
  if (!isString(inputUrl) || !inputUrl) return null;

  // poyfill the browseres URL api for node environment
  if (process.server) {
    /* eslint-disable */
    const { URL } = require('whatwg-url');
    global.URL = URL;
  }

  const parsedUrl = new URL(inputUrl, 'http://localhost');

  if (key && isString(key)) {
    return parsedUrl.searchParams.get(key);
  } else {
    const params = {};
    for (const a of parsedUrl.searchParams.entries()) {
      params[a[0]] = decodeURIComponent(a[1]);
    }
    return params;
  }
}
