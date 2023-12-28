import range from 'lodash/range';

export function createDummySegment(position = 1) {
  const lorem = 'Lorem ipsum dolor sit amet, consectetur adipisicing elit.';
  const length = Math.floor(Math.random() * 12 + 5);
  const randomLorem = lorem.substring(0, Math.floor(Math.random() * 20 + 30));
  return {
    classes: ['is-dummy'],
    content: Array(length).join(randomLorem),
    created: 0,
    id: position,
    lastModified: 0,
    lockedBy: null,
    original: Array(length).join(randomLorem),
    page: '',
    position,
    reference: 'Loading ...',
    tag: 'p',
    work: null,
    type: 'isDummy',
  };
}

export function createDummyArray(startPosition, limit = 10) {
  startPosition = startPosition ? parseInt(startPosition) : 1;
  limit = parseInt(limit);
  if (isNaN(startPosition) || isNaN(limit)) return [];
  return Array.from(range(startPosition, startPosition + limit), (i) =>
    createDummySegment(i)
  );
}
