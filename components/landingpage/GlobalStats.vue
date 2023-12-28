<template>
  <section
    class="o-wrapper o-wrapper--full-width u-text-center c-stats__wrapper o-flex o-flex--center"
  >
    <div class="c-stats__inner">
      <div class="c-stats__header">
        <h1>Support us</h1>
        <p>
          There is still a lot of work to be done, and we would
          <span>love</span> to have your help
        </p>
        <a
          class="c-btn c-btn--dark c-btn--primary c-btn__donate"
          href="https://partner.egwwritings.org/"
        >
          <img src="/img/donate-hand.png" class="donate-hand" /> Donate
          <span class="u-icon u-icon--move">keyboard_arrow_right</span>
        </a>
        <img class="love-img" src="/img/love-img.png" />
      </div>

      <div v-if="statsResult" class="c-stats__body">
        <ul class="c-stats o-flex o-flex--between">
          <li
            v-if="statsResult && statsResult.workProgress"
            class="c-stats__item o-flex o-flex--middle o-flex--between"
          >
            <div class="c-stats__item__info">
              <p class="stats">{{ statsResult.workProgress }}</p>
              <p class="description">Project in progress</p>
            </div>
            <div class="c-stats__item-icon">
              <img src="~/assets/images/stats-icon-1.png" />
            </div>
          </li>
          <li
            v-if="statsResult && statsResult.activeContributors"
            class="c-stats__item o-flex o-flex--middle o-flex--between"
          >
            <div class="c-stats__item__info">
              <p class="stats">{{ statsResult.activeContributors }}</p>
              <p class="description">Active Contributors</p>
            </div>
            <div class="c-stats__item-icon">
              <img src="~/assets/images/stats-icon-2.png" />
            </div>
          </li>
          <li
            v-if="statsResult && statsResult.remainingWork"
            class="c-stats__item o-flex o-flex--middle o-flex--between"
          >
            <div class="c-stats__item__info">
              <p class="stats">{{ statsResult.remainingWork }}</p>
              <p class="description">Remaining project</p>
            </div>
            <div class="c-stats__item-icon">
              <img src="~/assets/images/stats-icon-3.png" />
            </div>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup>
/* eslint-disable */ // TODO: fix lint
const props = defineProps({
  statsResult: { type: Object, default: () => {} },
});
</script>

<style lang="scss" scoped>
.c-stats__wrapper {
  padding: 0px;

  .c-stats__inner {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .c-stats__header {
    width: 1200px;
    max-width: 1900px;
    padding-top: 80px;
    padding-bottom: 80px;
    position: relative;

    h1 {
      font-size: 50px;
      font-weight: 600;
      line-height: 77px;
      letter-spacing: -0.005em;
    }
    p {
      font-weight: 400;
      font-size: 20px;
      line-height: 135%;
      color: $c-black-1;
      margin-bottom: 48px;
      span {
        color: #fe4389;
        font-weight: 600;
      }
    }
    .c-btn__donate {
      width: fit-content;
      .donate-hand {
        margin-right: 5px;
      }
    }

    .love-img {
      position: absolute;
      top: 21px;
      right: 288px;
    }
  }

  .c-stats__body {
    width: 100%;
    padding: 70px 130px;
    background: #d0f9d4;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .c-stats {
    width: 1200px;
    max-width: 1900px;
    list-style: none;
    padding-inline-start: 0px;
    margin: 0;

    .c-stats__item {
      width: 377px;
      height: 208px;
      border-radius: 8px;
      padding: 30px;
      &:nth-child(1) {
        background-image: url('/img/stats-bg-1.png');
        .stats {
          color: #1c8ab3;
        }
      }
      &:nth-child(2) {
        background-image: url('/img/stats-bg-2.png');

        .stats {
          color: #f4642d;
        }
      }
      &:nth-child(3) {
        background-image: url('/img/stats-bg-3.png');

        .stats {
          color: #6b3cf5;
        }
      }

      .c-stats__item__info {
        text-align: left;
        .stats {
          font-weight: 400;
          font-size: 45px;
          line-height: 120%;
          margin-bottom: 17px;
        }

        .description {
          margin-bottom: 0px;
          font-weight: 400;
          font-size: 15px;
          line-height: 150%;
          color: rgba(39, 39, 39, 0.8);
        }
      }
    }
  }
}

@media only screen and (max-width: 1400px) {
}

@media only screen and (max-width: 1200px) {
  .c-stats__wrapper {
    .c-stats__inner {
      width: 100%;
    }
    .c-stats__header {
      width: 100%;
    }
    .c-stats__body {
      padding: 70px;
    }

    .c-stats {
      width: 980px;
      .c-stats__item {
        width: 312px;
        height: 160px;
        padding: 20px;

        .c-stats__item__info {
          .stats {
            margin-bottom: 12px;
          }

          .description {
            font-size: 13px;
          }
        }

        .c-stats__item-icon {
          width: 80px;
          height: 80px;
        }
      }
    }
  }
}

@media only screen and (max-width: 1023px) {
  .c-stats__wrapper {
    padding: 0;

    .c-stats__inner {
      width: fit-content;
    }

    .c-stats__header {
      padding-top: 50px;
      padding-bottom: 50px;

      h1 {
        font-size: 45px;
      }
      p {
        font-size: 18px;
      }

      .love-img {
        top: 21px;
        right: 256px;
        width: 160px;
      }
    }

    .c-stats {
      .c-stats__item {
        width: 270px;
        height: 150px;
        padding: 15px;

        .c-stats__item-icon {
          width: 75px;
          height: 75px;
        }
      }
    }
  }
}

@media only screen and (max-width: 767px) {
  .c-stats__wrapper {
    .c-stats__inner {
      width: 100%;
    }
    .c-stats__header {
      width: 80%;

      .love-img {
        top: 29px;
        right: 52px;
        width: 160px;
      }
    }
    .c-stats__body {
      padding: 50px;
    }

    .c-stats {
      flex-direction: column;
      align-items: center;
      .c-stats__item {
        width: 350px;
        height: 208px;
        padding: 30px;

        margin-bottom: 20px;

        .c-stats__item__info {
          .stats {
            font-size: 45px;
            margin-bottom: 17px;
          }

          .description {
            font-size: 15px;
          }
        }

        .c-stats__item-icon {
          width: unset;
          height: unset;
        }
      }
    }
  }
}

@media only screen and (max-width: 480px) {
  .c-stats__wrapper {
    .c-stats__header {
      h1 {
        font-size: 30px;
      }

      .love-img {
        right: 0;
        width: 129px;
      }
    }
  }
}
</style>
