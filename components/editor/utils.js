import isEmpty from 'lodash/isEmpty';

export const headingLevels = [1, 2, 3, 4, 5, 6];
export const nonEgwTypes = [
  'appendix',
  'comment',
  'foreword',
  'intro',
  'note',
  'preface',
  'text',
];
export const entityTypes = [
  'addressee',
  'date',
  'place',
  'topic',
  'topic-word',
];
export const directions = ['rtl', 'ltr'];

/**
 * The function `getOpeningHTMLTagsByOriginalContent` returns a substring of the original content up to
 * a specified position, optionally including a tag at that position.
 * @param originalContent - The original content is the string that contains the entire HTML content.
 * @param wSentPosition - The `wSentPosition` parameter represents the position of a word or sentence
 * in the `originalContent` string. It is used to determine the substring of the `originalContent` that
 * should be returned.
 * @param [includeWSentTag=false] - The `includeWSentTag` parameter is a boolean value that determines
 * whether or not to include the "wSent" tag in the returned HTML tags. If `includeWSentTag` is set to
 * `true`, the "wSent" tag will be included in the returned HTML tags. If
 * @returns The function `getOpeningHTMLTagsByOriginalContent` returns a substring of the
 * `originalContent` string up to the `wSentPosition` index. If `includeWSentTag` is true, it also
 * includes an additional 8 characters from the `originalContent` string starting from the
 * `wSentPosition` index. If either `originalContent` or `wSentPosition` is fals
 */
export const getOpeningHTMLTagsByOriginalContent = (
  originalContent,
  wSentPosition,
  includeWSentTag = false
) => {
  const wSentCharCount =
    originalContent?.substring(wSentPosition).indexOf('>') + 1;

  if (originalContent && wSentPosition) {
    return originalContent?.substring(
      0,
      wSentPosition + (includeWSentTag ? wSentCharCount : 0)
    );
  }

  return null;
};

/**
 * The function `getClosingHTMLTagsByOriginalContent` takes an array of opening HTML tag elements and
 * returns a string of corresponding closing HTML tag elements.
 * @param openingHTMLTagElements - An array of opening HTML tag elements.
 * @returns the closing HTML tags as a string.
 */
export const getClosingHTMLTagsByOriginalContent = (openingHTMLTagElements) => {
  if (openingHTMLTagElements) {
    const stripBreakTags = openingHTMLTagElements
      .toString()
      .replace(/(<\/?(br)\/?>)/gi, '');
    const endingTags = stripBreakTags.replace(/</g, '</');

    const endingHTMLTagElements = endingTags
      .split('>')
      ?.filter((item) => item.trim() !== '')
      ?.map((item) => item + '>')
      ?.reverse()
      .join('');

    return endingHTMLTagElements;
  }

  return null;
};

/**
 * The `formatFinalHTMLContent` function takes in original and translated content, along with a parent
 * tag and a flag for multi-sentence content. It extracts opening and closing HTML tags from the
 * original content and combines them with the translated content to create a formatted final HTML
 * content.
 * @param originalContent - The original content that needs to be formatted. It can be a string or an
 * array of strings.
 * @param translatedContent - The `translatedContent` parameter is the content that has been translated
 * from the original content. It can be a string or an array of strings.
 * @param parentTag - The `parentTag` parameter is a string that represents the parent HTML tag of the
 * content. It is used to determine whether to include the `<w-sent>` tag in the final formatted HTML
 * content. If the `parentTag` is `'w-heading'`, the `<w-sent>` tag
 * @param [multiSentence=false] - A boolean value indicating whether the translated content should be
 * split into multiple sentences or not. The default value is false.
 * @returns The function `formatFinalHTMLContent` returns a formatted HTML content string.
 */
export const formatFinalHTMLContent = (
  originalContent,
  translatedContent,
  parentTag,
  multiSentence = false
) => {
  const firstWSentIndex = originalContent?.indexOf('<w-sent');

  if (firstWSentIndex > 0) {
    const includeWSentTag = !multiSentence && parentTag === 'w-heading';

    const openingHTMLTagElements = getOpeningHTMLTagsByOriginalContent(
      originalContent,
      firstWSentIndex,
      includeWSentTag
    );

    const endingHTMLTagElements = getClosingHTMLTagsByOriginalContent(
      openingHTMLTagElements
    );

    if (translatedContent instanceof Array) {
      return [
        openingHTMLTagElements,
        ...translatedContent,
        endingHTMLTagElements,
      ].join('');
    }

    return [
      openingHTMLTagElements,
      translatedContent,
      endingHTMLTagElements,
    ].join('');
  }

  return '';
};

/**
 * The function `getWSentContentArray` takes a string `content` as input and returns an array of all
 * the substrings that match the pattern `<w-sent.*?>.*?</w-sent>`.
 * @param content - The `content` parameter is a string that represents the content you want to search
 * for `<w-sent>` elements in.
 * @returns The function `getWSentContentArray` returns an array of strings that match the pattern
 * `<w-sent.*?>.*?</w-sent>` in the `content` string. If the `content` string is empty or falsy, an
 * empty array is returned.
 */
export const getWSentContentArray = (content) => {
  if (content) {
    // eslint-disable-next-line
    return content.match(/<w-sent.*?>.*?<\/w-sent\>/gs);
  }
  return [];
};

const singleTagHTMLParser = (options) => {
  const { content, parse } = options;
  let tempContent = content;

  const voidTags = [
    'area',
    'base',
    'br',
    'col',
    'embed',
    'hr',
    'img',
    'input',
    'link',
    'meta',
    'param',
    'source',
    'track',
    'wbr',
  ];

  const foundTags = voidTags.filter((tag) => content.includes(tag));
  if (!isEmpty(foundTags)) {
    if (parse) {
      foundTags.forEach((tag) => {
        tempContent = tempContent.replace(
          new RegExp('<' + tag + '>', 'g'),
          '<' + tag + '/>'
        );
      });
      return tempContent;
    } else {
      foundTags.forEach((tag) => {
        tempContent = tempContent.replace(
          new RegExp('<' + tag + '/>', 'g'),
          '<' + tag + '>'
        );
      });
      return tempContent;
    }
  }

  return tempContent;
};

/**
 * The function `getInnerContentFromHTMLString` takes an HTML string as input and returns the inner
 * content of the first element in the HTML string.
 * @param content - The `content` parameter is a string that represents an HTML document.
 * @returns The inner content of the HTML string.
 */
export const getInnerContentFromHTMLString = (content) => {
  const parsedContent = singleTagHTMLParser({
    content,
    parse: true,
  });

  if (parsedContent) {
    const parsedHTML = new DOMParser().parseFromString(
      parsedContent,
      'text/xml'
    );

    const innerContent = parsedHTML.firstChild.innerHTML;

    const parsedInnerContent = singleTagHTMLParser({
      content: innerContent,
      parse: false,
    });

    return parsedInnerContent;
  }
};

/**
 * The function `createWsentContentArray` takes an array of sentences, a new content, a target
 * position, and a source position as parameters. It returns an array where each element is either the
 * new content wrapped with w-sent tags or the string `<w-sent></w-sent>`, depending on the target and source positions.
 * @param sentencesArray - An array of sentences.
 * @param newContent - The `newContent` parameter is the content that you want to insert into the
 * `sentencesArray` at the specified `targetPosition`.
 * @param targetPosition - The `targetPosition` parameter represents the position in the
 * `sentencesArray` where the `newContent` should be inserted.
 * @param sourcePosition - The `sourcePosition` parameter represents the position of the sentence in
 * the `sentencesArray` that you want to replace with the `newContent`.
 * @returns an array called `contentWSentArray`.
 */
export const createWsentContentArray = (
  sentencesArray,
  newContent,
  targetPosition
) => {
  const contentWSentArray = sentencesArray?.map((_item, index) => {
    if (targetPosition === index) {
      return newContent;
    }
    return '<w-sent></w-sent>';
  });

  return contentWSentArray;
};

/**
 * The function converts an XML document object to a string representation.
 * @param content - The `content` parameter is expected to be an XML document object.
 * @returns the converted XML document as a string.
 */
const convertXMLDOCToString = (content) => {
  const convertedContent = new XMLSerializer().serializeToString(content);

  return convertedContent;
};

/**
 *
 * This function formats the content of type paragraph and makes it ready to send to backend
 * @returns
 */

export const contentFormatterForParagraphType = ({
  originalContent,
  translatedContent,
}) => {
  const stringToHtml = new DOMParser().parseFromString(
    originalContent,
    'text/xml'
  );

  const spanEl = [...stringToHtml.getElementsByTagName('*')].find(
    (item) => item.nodeName === 'span'
  );

  if (spanEl) {
    const wTextBlockElInOriginal = [
      ...stringToHtml.getElementsByTagName('*'),
    ].find((item) => item.nodeName === 'w-text-block');

    spanEl.innerHTML = translatedContent;

    if (wTextBlockElInOriginal) {
      // remove unwanted content
      wTextBlockElInOriginal.innerHTML = '';
      // add translated content
      wTextBlockElInOriginal.appendChild(spanEl);
    }

    const finalContent = convertXMLDOCToString(stringToHtml);

    return finalContent;
  } else {
    const wTextBlockEl = [...stringToHtml.getElementsByTagName('*')].find(
      (item) => item.nodeName === 'w-text-block'
    );

    wTextBlockEl.innerHTML = translatedContent;

    const finalContent = convertXMLDOCToString(stringToHtml);

    return finalContent;
  }
};

/**
 * The function `formatContentForSentenceContent` takes in a parent tag and new content as parameters.
 * If the parent tag is 'w-heading', it extracts the inner content from the new content and wraps it in
 * a `<w-sent>` tag. Otherwise, it returns the new content as is.
 * @param parentTag - The `parentTag` parameter is a string that represents the tag of the parent
 * element in an HTML document.
 * @param newContent - The `newContent` parameter is a string that represents the content that needs to
 * be formatted.
 * @returns The function `formatContentForSentenceContent` returns a modified version of the
 * `newContent` parameter. If the `parentTag` parameter is equal to 'w-heading', the function wraps the
 * `innerContent` in `<w-sent>` tags and returns it. Otherwise, it returns the `newContent` as is.
 */
const formatContentForSentenceContent = (parentTag, newContent) => {
  if (parentTag === 'w-heading') {
    const innerContent = getInnerContentFromHTMLString(newContent);
    return '<w-sent>' + innerContent + '</w-sent>';
  } else {
    return newContent;
  }
};

/**
 *
 * This function formats the content of type sentence and makes it ready to send to backend
 * @returns
 */
export const contentFormatterForSentenceType = ({
  tag,
  originalContent,
  parentTag,
  content,
  sentences,
  multipleSentences,
  segmentContent,
  sentencePosition,
}) => {
  if (tag === 'w-heading') {
    const innerContent = getInnerContentFromHTMLString(content);

    return {
      formattedContent: formatFinalHTMLContent(
        originalContent,
        innerContent,
        parentTag
      ),
      rawContent: innerContent,
    };
  } else if (multipleSentences) {
    /* eslint-disable */
    let preTranslatedContentArray = getWSentContentArray(segmentContent);

    let translatedContent = [];

    if (isEmpty(preTranslatedContentArray)) {
      const formattedContent = formatContentForSentenceContent(
        parentTag,
        content
      );

      translatedContent = createWsentContentArray(
        sentences,
        formattedContent,
        sentencePosition
      );
    } else {
      preTranslatedContentArray[sentencePosition] =
        formatContentForSentenceContent(parentTag, content);

      translatedContent = preTranslatedContentArray;
    }

    return {
      formattedContent: formatFinalHTMLContent(
        originalContent,
        translatedContent,
        parentTag,
        true
      ),
      rawContent: translatedContent,
    };
  } else {
    return {
      formattedContent: content,
    };
  }
};

export const checkIfContentHasMultipleSentences = (sourceText) => {
  const wsentArray = getWSentContentArray(sourceText);
  return wsentArray?.length > 1;
};
