import { defineStore, storeToRefs } from 'pinia';
import { useTranslationStore } from './translations';
import { fetchAPI } from '~/helpers/apiCore';

export const useEditorStore = defineStore({
  id: 'editor-store',
  state: () => ({
    editorInstance: {},
    options: {
      isTextSelected: false,
      isHeading: false,
      headingLevel: null,
      pageBreak: null,
    },
  }),
  getters: {
    getTextEditorInstance: (state) => state.editorInstance,
  },
  actions: {
    setEditorInstance(editor) {
      this.editorInstance = editor;
    },
    setEditorOptions(key, value) {
      this.options[key] = value;
    },
    async fetchAllowedPageBreak() {
      const translations = useTranslationStore();
      const { currentSegment } = storeToRefs(translations);

      const workId = currentSegment.value?.work;
      const segmentPosition = currentSegment.value?.position;

      try {
        const data = await fetchAPI(
          `/translations/${workId}/segments/${segmentPosition}/egw_page_break/`
        );
        if (data?.statusCode === 200 && data?.data?.pageBreak) {
          this.options.pageBreak = data?.data?.pageBreak;
          return data?.data;
        } else {
          this.options.pageBreak = null;
        }
        return null;
      } catch (error) {
        this.options.pageBreak = null;
        return error;
      }
    },
  },
});
