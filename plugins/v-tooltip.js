import { VTooltip, VPopover } from 'v-tooltip';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(VTooltip, {
    popover: {
      defaultDelay: 100,
      defaultTrigger: 'hover focus',
      defaultOffset: 12,
      defaultPlacement: 'bottom',
      defaultClass: '', // e.g. "c-tooltip--wide"
      defaultBaseClass: 'c-tooltip',
      defaultWrapperClass: 'c-tooltip__wrapper',
      defaultInnerClass: 'c-tooltip__inner',
      defaultArrowClass: 'c-tooltip__arrow',
    },
  });

  nuxtApp.vueApp.use('v-popover', VPopover);
});
