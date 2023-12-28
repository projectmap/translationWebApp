<template>
  <section
    id="about-us"
    class="o-wrapper o-wrapper--full-width u-text-center c-about__wrapper o-flex o-flex--column o-flex--middle"
  >
    <div class="c-about__header">
      <p class="c-about__sub-title">About Us</p>
      <h1 class="c-about__title">Sharing the gift of light</h1>
      <p class="c-about__description">
        "Sharing the Gift of Light" is the new strategic Spirity of Prophecy
        translation initiative for the 2020-2025 quinquennium. This is a
        continuation and expansion of the 'Growing Together' project translating
        12 EGW books into 55 languages. Focus will also be given to 16 core
        Ellen White books, plus more translations into additional mission
        languages.
      </p>
    </div>

    <div class="book-covers-slider">
      <div class="prev-icon" @click="movePrev">
        <span class="u-icon"> keyboard_arrow_left </span>
      </div>
      <ul ref="container" class="book-covers__inner" @mousewheel="onMouseWheel">
        <li
          v-for="(project, index) in staticProjectsList"
          id="book-cover-item"
          :key="index"
          class="book-cover"
          @mousedown="handleMouseDown"
        >
          <img v-if="project.key" :src="`${egwApi}/covers/${project.key}`" />
          <img v-if="project.img" :src="project.img" />
        </li>
      </ul>
      <div class="next-icon" @click="moveNext">
        <span class="u-icon"> keyboard_arrow_right </span>
      </div>
    </div>
  </section>
</template>

<script setup>
/* eslint-disable */ // TODO: fix lint
const props = defineProps({
  egwApi: { type: String, default: '' },
});

const container = ref(null);

let startX = null;
let startScrollLeft = null;
let isDragging = false;

const staticProjectsList = [
  {
    title: 'Patriarchs and Prophets',
    key: '84',
  },
  {
    title: 'Prophets and Kings',
    key: '88',
  },
  {
    title: 'The Desire of Ages',
    key: '130',
  },
  {
    title: 'The Acts of the Apostles',
    key: '127',
  },
  {
    title: 'The Great Controversy',
    key: '132',
  },
  {
    title: 'Steps to Christ',
    key: '108',
  },
  {
    title: 'The Story of Redemption',
    key: '145',
  },
  {
    title: 'The Ministry of Healing',
    key: '135',
  },
  {
    title: 'Ministry to the Cities',
    key: '12399',
  },
  {
    title: "The Three Angels' Messages",
    img: '/img/3ambook-cover.png',
  },
  {
    title: 'Christian Service',
    key: '13',
  },
  {
    title: "Christ's Object Lessons",
    key: '15',
  },
  {
    title: 'Counsels for the Church',
    key: '19',
  },
  {
    title: 'Counsels on Stewardship',
    key: '22',
  },
  {
    title: 'Education',
    key: '29',
  },
  {
    title: 'Jesus, Name Above All Names',
    key: '14150',
  },
];

const handleMouseDown = (event) => {
  event.preventDefault();
  startX = event.pageX;
  startScrollLeft = container.value.scrollLeft;
  isDragging = true;
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
};
const handleMouseMove = (event) => {
  if (!isDragging) return;
  const deltaX = event.pageX - startX;
  const newScrollLeft = startScrollLeft - deltaX;
  container.value.scrollLeft = newScrollLeft;
};
const handleMouseUp = () => {
  isDragging = false;
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);
};
const onMouseWheel = (event) => {
  event.preventDefault();
  container.value.scrollLeft += event.deltaY;
};
const movePrev = () => {
  container.value.scrollBy({
    left: 200, // adjust the value as per your requirement
    behavior: 'smooth',
  });
};
const moveNext = () => {
  container.value.scrollBy({
    left: -200, // adjust the value as per your requirement
    behavior: 'smooth',
  });
};
</script>

<style lang="scss" scoped>
.c-about__wrapper {
  padding: 120px 0;
  overflow: hidden;
  .c-about__header {
    text-align: left;
    width: 1200px;

    .c-about__sub-title {
      font-weight: 600;
      font-size: 15px;
      line-height: 150%;
      margin-bottom: 15px;
      text-transform: uppercase;
      color: $c-primary-6;
    }

    .c-about__title {
      font-weight: 600;
      font-size: 50px;
      line-height: 120%;
      color: $c-black-1;
    }

    .c-about__description {
      width: 780px;
      font-weight: 400;
      font-size: 15px;
      line-height: 150%;
      color: rgba(39, 39, 39, 0.8);
    }
  }

  .book-covers-slider {
    display: flex;
    margin-top: 60px;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    width: 100%;
    max-width: 1900px;
    position: relative;

    .prev-icon,
    .next-icon {
      position: absolute;
      font-size: 30px;
      background: rgba($color: #000000, $alpha: 0.6);
      color: #ffffff;
      border-radius: 50%;
      height: 35px;
      width: 35px;
      display: flex;
      align-content: center;
      justify-content: center;
      cursor: pointer;

      &:hover {
        background: rgba($color: #000000, $alpha: 1);
      }
    }

    .prev-icon {
      left: 30px;
    }

    .next-icon {
      right: 30px;
    }

    .book-covers__inner {
      display: -webkit-box;
      list-style: none;
      overflow-x: auto;
      margin-left: 0px;
      scroll-behavior: smooth;
      margin-bottom: 0px;
      .book-cover {
        margin-right: 20px;
        width: 95px;
        height: 126px;
        &:nth-child(1) {
          margin-left: 20px;
        }

        img {
          width: 100%;
          height: 100%;
        }
      }

      &::-webkit-scrollbar {
        display: none;
        // height: 8px;
      }

      // /* Track */
      // &::-webkit-scrollbar-track {
      //   border-radius: 10px;
      //   display: none;
      // }

      // /* Handle */
      // &::-webkit-scrollbar-thumb {
      //   background-color: darkgray;
      //   border-radius: 5px;
      // }

      // &:hover {
      //   &::-webkit-scrollbar {
      //     display: block;
      //   }
      // }
    }
  }
}

@media only screen and (max-width: 1200px) {
  .c-about__wrapper {
    padding: 100px 0;
    align-items: unset;
    .c-about__header {
      width: fit-content;
      padding-left: 100px;
    }
  }
}

@media only screen and (max-width: 1023px) {
  .c-about__wrapper {
    padding: 80px 0;
    .c-about__header {
      width: fit-content;
      padding-left: 80px;

      .c-about__title {
        font-size: 45px;
      }
    }

    .book-covers-slider {
      margin-top: 50px;
    }
  }
}

@media only screen and (max-width: 767px) {
  .c-about__wrapper {
    padding: 80px 0;
    .c-about__header {
      width: fit-content;
      padding-left: 80px;

      .c-about__sub-title {
        font-size: 14px;
      }

      .c-about__title {
        font-size: 35px;
      }

      .c-about__description {
        width: 550px;
        font-weight: 400;
        font-size: 14px;
        text-align: justify;
      }
    }

    .book-covers-slider {
      margin-top: 40px;
      .book-covers__inner {
        .book-cover {
          margin-right: 20px;
          width: 100px;
          height: 130px;
          margin-bottom: 0px;
          &:nth-child(1) {
            margin-left: 20px;
          }
        }
      }
    }
  }
}

@media only screen and (max-width: 480px) {
  .c-about__wrapper {
    .c-about__header {
      padding-left: 30px;
      padding-right: 30px;
      text-align: center;

      .c-about__title {
        font-size: 30px;
      }

      .c-about__description {
        width: 100%;
        text-align: center;
      }
    }
  }
}
</style>
