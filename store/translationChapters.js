import { defineStore } from 'pinia';

export const useTranslationChaptersStore = defineStore({
  id: 'translation chapters-store',
  state: () => ({
    cachedChapters: [],
  }),
  actions: {
    getCurrentChapterIndex(chapterNum) {
      return this.cachedChapters.findIndex(
        (item) => item.chapter.number === chapterNum
      );
    },
    getCurrentChapter(chapterNum) {
      return this.cachedChapters.find(
        (item) => item.chapter.number === chapterNum
      );
    },
    insertSegmentToChapter(chapterNum, segmentData) {
      const chapterIndex = this.getCurrentChapterIndex(chapterNum);

      if (this.cachedChapters[chapterIndex]?.segments?.length > 0) {
        segmentData.forEach((segment) => {
          if (
            this.cachedChapters[chapterIndex]?.segments
              .map((item) => item?.id)
              ?.indexOf(segment?.id) < 0
          ) {
            this.cachedChapters[chapterIndex]?.segments.push(segment);
          }
        });
      } else {
        this.cachedChapters[chapterIndex].segments = segmentData;
      }
    },
    patchCachedChapterData(chapterNum, data) {
      const chapterIndex = this.getCurrentChapterIndex(chapterNum);
      Object.assign(this.cachedChapters[chapterIndex].chapter, data);
    },
    patchCachedChapterSegmentData(chapterNum, data) {
      const chapterIndex = this.getCurrentChapterIndex(chapterNum);
      if (this.cachedChapters[chapterIndex]?.segments) {
        const indexOfSegment = this.cachedChapters[chapterIndex].segments
          ?.map((cs) => cs?.id)
          ?.indexOf(data?.id);
        if (indexOfSegment > -1) {
          Object.assign(
            this.cachedChapters[chapterIndex].segments[indexOfSegment],
            data
          );
        }
      }
    },
    deleteCachedChapterSegmentData(chapterNum) {
      const chapterIndex = this.getCurrentChapterIndex(chapterNum);
      if (this.cachedChapters[chapterIndex]) {
        this.cachedChapters = this.cachedChapters?.filter(
          (chap) =>
            chap?.chapter?.number !==
            this.cachedChapters[chapterIndex]?.chapter?.number
        );
      }
    },
    cacheChapters(data) {
      this.cachedChapters.push(data);
    },
    optimizeChapters(currentChapterNum, numberOfNextPrevChapter) {
      const highrange = currentChapterNum + numberOfNextPrevChapter;
      const lowrange = currentChapterNum - numberOfNextPrevChapter;

      this.cachedChapters = this.cachedChapters.filter(
        (item) =>
          (item.chapter.number < highrange ||
            item.chapter.number === highrange) &&
          (item.chapter.number > lowrange || item.chapter.number === lowrange)
      );
    },
  },
  persist: {
    storage: localStorage,
  },
});
