import {
  getLocalSegmentVotesByWorkData,
  getLocalTranslatedSegmentByWorkData,
} from '~/service-worker/db';

export const checkSyncedDataForCurrentChapter = async (chapter) => {
  const currentChapterUnsyncedSegments =
    await getLocalTranslatedSegmentByWorkData(0, 'synced');

  const currentChapterUnsyncedVotes = await getLocalSegmentVotesByWorkData(
    0,
    'synced'
  );

  const unsynchedSegments = currentChapterUnsyncedSegments?.filter(
    (sg) =>
      sg.chapter === parseInt(chapter?.chapterNumber) &&
      sg.work === chapter?.work
  );

  const unsynchedVotes = currentChapterUnsyncedVotes?.filter(
    (sv) =>
      sv.chapter === parseInt(chapter?.chapterNumber) &&
      sv.work === chapter?.work
  );

  return {
    segments: unsynchedSegments,
    votes: unsynchedVotes,
  };
};
