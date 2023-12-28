import { defineStore } from 'pinia';

export const useSentenceStore = defineStore({
  id: 'sentence-store',
  state: () => ({
    sentenceTranslationContent: '',
  }),
  getters: {},
  actions: {
    setSentenceTranslationContent(content) {
      this.sentenceTranslationContent = content;
    },
  },
  persist: {
    storage: localStorage,
  },
});
