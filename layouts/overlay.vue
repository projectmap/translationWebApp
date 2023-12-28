<template>
  <div id="app" class="o-site">
    <alerts-component />
    <site-header id="site-header" overlay @scroll-content="scrollToContent" />
    <main id="site-content" role="main">
      <slot />
    </main>
    <site-footer id="site-footer" overlay @scroll-content="scrollToContent" />
  </div>
</template>

<script setup>
import { disableRightClickOnSiteOnProduction } from '../helpers/Util';
import SiteHeader from '@/components/header';
import SiteFooter from '@/components/footer';
import AlertsComponent from '~/components/alerts/AlertsComponent.vue';

disableRightClickOnSiteOnProduction();
const scrollToContent = (documentId) => {
  const element = document.getElementById(documentId);
  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
};
</script>
