import DOMPurify from 'dompurify';
import lowerCase from 'lodash/lowerCase';
import upperCase from 'lodash/upperCase';
import snakeCase from 'lodash/snakeCase';
import kebabCase from 'lodash/kebabCase';
import startCase from 'lodash/startCase';

export const wrap = (object) => {
  if (object?.subType && object?.subValue) {
    return `<${object.tag} ${object.subType}="${object.subValue}">${object.content}</${object.tag}>`;
  }
  return `<${object.tag}>${object.content}</${object.tag}>`;
};

export const sanitize = (string) => {
  // Polifill with jsdom for the node environment
  if (process.server) {
    /* eslint-disable */
    const createDOMPurify = require('dompurify');
    const { JSDOM } = require('jsdom');

    const DOMPurify = createDOMPurify(new JSDOM('').window);
    return DOMPurify.sanitize(string);
  }

  return DOMPurify.sanitize(string);
};

/**
 * Remove enclosing html-tags of a string
 */
export const unwrap = (string) => {
  string = string ? String(string) : '';
  return string.replace(/^(?:<[^>]+>)?(.+?)(?:<\/[^>]+>)?$/i, '$1');
};

export const stripbreaks = (string) => {
  string = string ? String(string) : '';
  string = string.replace(/(<\/?(br|p|div)\/?>)/gi, ' ');
  return string.replace(/\s*$/i, '');
};

export const striptags = (string) => {
  string = string ? String(string) : '';
  return string.replace(/(<[^>]+?>)/gi, '');
};

export const truncate = (string, maxLength = 24) => {
  string = string ? String(string) : '';
  return string.length > maxLength
    ? string.substr(0, maxLength - 3) + '...'
    : string;
};

export const join = (array) => {
  return Array.isArray(array) ? array.join(' ') : array;
};

export const noZero = (number) => {
  return parseInt(number) === 0 ? 'no' : number;
};

/*
 * Add thousand seperator
 */
export const formatNumber = (number) => {
  return number.toLocaleString('en');
};

/*
 * Convert Case
 */
export const ucfirst = (string) => {
  string = string ? String(string) : '';
  return string.length > 0
    ? string.charAt(0).toUpperCase() + string.slice(1)
    : '';
};

export const uppercase = (string) => {
  return upperCase(string);
};

export const lowercase = (string) => {
  return lowerCase(string);
};

export const snakecase = (string) => {
  return snakeCase(string);
};

export const kebabcase = (string) => {
  return kebabCase(string);
};

export const startcase = (string) => {
  return startCase(string);
};

export const twoDecimalPlaces = (num) => {
  const amt = Number(num);
  return (
    (amt && amt.toLocaleString(undefined, { maximumFractionDigits: 2 })) || '0'
  );
};

export default {
  wrap,
  sanitize,
  unwrap,
  stripbreaks,
  striptags,
  truncate,
  join,
  noZero,
  formatNumber,
  ucfirst,
  uppercase,
  lowercase,
  snakecase,
  startcase,
  kebabcase,
  twoDecimalPlaces,
};
