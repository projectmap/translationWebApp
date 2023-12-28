<template>
  <footer class="c-footer--landing">
    <div class="o-wrapper">
      <ul class="o-list-inline u-small u-mb0">
        <li class="u-mv--">
          <nuxt-link to="/legal-copyright-notice" target="_blank">
            Copyright &copy; {{ currentYear }} Ellen4all
          </nuxt-link>
        </li>
        <li class="u-mv--">
          <button @click.prevent="scrollToContent('about-us')">About Us</button>
        </li>
        <li class="u-mv--">
          <button @click.prevent="scrollToContent('projects')">Projects</button>
        </li>
        <li class="u-mv--">
          <button @click.prevent="scrollToContent('contact')">
            Contact Us
          </button>
        </li>
      </ul>
    </div>
  </footer>
</template>

<script setup>
const currentYear = computed(() => new Date().getFullYear());

// Register Custom events
const emit = defineEmits(['scroll-section']);

// Methods
const scrollToContent = (documentId) => {
  emit('scroll-section', documentId);
};
</script>

<style lang="scss" scoped>
.c-footer--landing {
  padding: 16px 100px;
  text-align: right;

  ul {
    li {
      margin-left: 45px;
      button {
        border: 0;
        background: none;
        padding: 0;
        cursor: pointer;
        font-size: 16px;
        font-weight: 400;
        line-height: 150%;
        letter-spacing: 0.005em;
        color: rgba(39, 39, 39, 0.8);
        transition: color 0.2s ease-in-out;
      }

      &:hover {
        button {
          color: $c-primary-5;
        }
      }
    }
  }
}

@media only screen and (max-width: 1023px) {
  .c-footer--landing {
    padding: 16px;
    text-align: right;
  }
}

@media only screen and (max-width: 767px) {
  .c-footer--landing {
    text-align: center;

    ul {
      li {
        &:first-child {
          margin-left: 0;
        }
      }
    }
  }
}

@media only screen and (max-width: 480px) {
  .c-footer--landing {
    text-align: center;
    .o-wrapper {
      padding: 0px;
    }
    ul {
      li {
        &:first-child {
          margin-left: 0;
        }
        margin-left: 15px;
        button {
          font-size: 14px;
        }
      }
    }
  }
}
</style>
