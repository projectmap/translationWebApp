<template>
  <section
    id="projects"
    class="o-wrapper o-wrapper--full-width u-text-center c-projects__wrapper o-flex o-flex--center"
  >
    <div class="c-project__inner o-flex o-flex--middle o-flex--column">
      <h1 class="c-projects__header">Ongoing Projects</h1>
      <p class="c-projects__description">
        The “Gift of Light” project has 660 books. Including translations from
        completed previously. The total number of books that have been funded at
        the conclusion of this project is 489. There are still 156 books yet to
        receive requests for translation funding by the SOP Committee. 324 of
        the 489 books are currently available on the Ellen G. White Writings web
        site. When these 55 languages are translated, close to 90% of the
        world's population can read the 12 Ellen White books. With four
        additional new Ellen G. White books been added to the original 12 books
        this total number of new translations will expand along with new
        additional languages been added to the project over the course of the
        quinquennium.
      </p>
      <ul v-if="!isProjectsListEmpty" class="c-projects-list u-mb0">
        <li
          v-for="(project, index) in projectList"
          :key="index"
          class="c-project o-flex o-flex--between"
        >
          <div class="c-project__left o-flex o-flex--middle">
            <book
              :size="'small'"
              :number="egwBookNumber(project)"
              :egw-api="egwApi"
            />
            <div class="c-project__info">
              <h6>{{ project.title }}</h6>
              <span
                class="c-badge c-badge--soft"
                :class="{
                  'c-badge--red':
                    project.bookProgress > 1 && project.bookProgress < 8,
                  'c-badge--primary':
                    project.bookProgress === 0 || project.bookProgress === 1,
                  'c-badge--green':
                    project.bookProgress === 11 ||
                    (project.bookProgress > 7 && project.bookProgress < 11),
                }"
              >
                {{ getStatus(project) }}
              </span>
            </div>
          </div>
          <div class="c-project__right o-flex o-flex--column">
            <div class="c-project__stats-top o-flex o-flex--between">
              <div class="language-info">
                <span class="source-lang">ENG</span> ...
                <span class="target-lang">{{ getLang(project) }}</span>
              </div>
              <span class="completion-percentage"
                >{{
                  completionPercentage(project.statistics, 'reviewDone')
                }}%</span
              >
            </div>
            <div class="c-project__stats-bottom">
              <div class="progress-bar">
                <progress-component :stats="project.statistics" wide />
              </div>
            </div>
          </div>
        </li>
      </ul>
      <ul v-else class="c-projects-list u-mb0">
        <li
          class="c-project c-project--empty-message o-flex o-flex--column o-flex--middle"
        >
          <img
            class="u-mb-"
            src="/img/illustration-empty.svg"
            style="max-width: 200px"
          />
          <p class="u-bold u-mb0">We couldn't find any books ...</p>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup>
import get from 'lodash/get';
import floor from 'lodash/floor';
import isEmpty from 'lodash/isEmpty';
import Book from '@/components/project-list/project/Book.vue';
import ProgressComponent from '@/components/utilities/Progress';

const props = defineProps({
  egwApi: {
    type: String,
    default: '',
  },
  projectList: {
    type: Array,
    default: () => [],
  },
});

const isProjectsListEmpty = computed(() => isEmpty(props.projectList));

const egwBookNumber = (project) => {
  return parseInt(get(project, 'original.key'));
};

const getLang = (project) => {
  if (project?.languageObj?.name) {
    return project?.languageObj?.name.substring(0, 3);
  }
};

const getStatus = (project) => {
  if (project?.bookProgress === 0) {
    return 'In Translation';
  } else if (project?.bookProgress === 1) {
    return 'Translation Done';
  } else if (project?.bookProgress > 1 && project?.bookProgress < 8) {
    return 'In Review';
  } else if (project?.bookProgress > 7 && project?.bookProgress < 11) {
    return 'In Approval';
  } else if (project?.bookProgress === 11) {
    return 'Approved';
  } else {
    return 'In Process';
  }
};

const completionPercentage = (stats, prop) => {
  const x = stats?.[prop];
  const y = stats?.segments;
  return y === 0 ? 0 : floor((x / y) * 100, 1);
};
</script>

<style lang="scss" scoped>
.c-projects__wrapper {
  padding: 120px 130px;
  background-image: url('~/assets/images/bubble-background.png');
  background-size: cover;

  .c-project__inner {
    width: 1200px;
    .c-projects__header {
      color: $c-black-1;
      font-weight: 600;
      font-size: 50px;
      line-height: 120%;
      margin-bottom: 29px;
    }

    .c-projects__description {
      font-weight: 400;
      font-size: 15px;
      line-height: 150%;
      text-align: center;
      letter-spacing: 0.005em;
      color: rgba(39, 39, 39, 0.8);
      width: 920px;
    }

    .c-projects-list {
      list-style: none;
      width: 920px;
      min-height: fit-content;
      max-height: 571px;
      background: white;
      padding: 28px;
      border-radius: 4px;
      margin-top: 48px;
      .c-project {
        &:not(:nth-child(1)) {
          padding-top: 18px;
        }

        &:not(:last-child) {
          padding-bottom: 18px;
          border-bottom: 1px solid rgba(223, 227, 229, 0.6);
        }

        &.c-project--empty-message {
          p {
            margin-top: 20px;
          }
        }

        .c-project__left {
          .c-project__info {
            text-align: left;
            margin-left: 16px;
            h6 {
              font-weight: 600;
              font-size: 16px;
              line-height: 140%;
              color: rgba(39, 39, 39, 0.84);
              margin-bottom: 15px;
            }

            .c-badge {
              text-transform: uppercase;
              font-size: 10px;
              border-radius: 2px;
            }
          }
        }

        .c-project__right {
          width: 345px;
          margin-top: auto;

          .c-project__stats-top {
            margin-bottom: 5px;
            width: 100%;

            span {
              font-weight: 500;
              font-size: 12px;
              line-height: 150%;
              letter-spacing: 0.0025em;
              color: rgba(39, 39, 39, 0.8);
            }
            .language-info {
              span {
                text-transform: uppercase;
              }
              .source-lang {
                margin-right: 16px;
              }

              .target-lang {
                margin-left: 16px;
              }
            }
          }

          .c-project__stats-bottom {
            width: 100%;
          }
        }
      }
    }
  }
}

@media only screen and (max-width: 1400px) {
}

@media only screen and (max-width: 1200px) {
  .c-projects__wrapper {
    padding: 100px;

    .c-project__inner {
      width: fit-content;
    }
  }
}

@media only screen and (max-width: 1023px) {
  .c-projects__wrapper {
    padding: 80px;

    .c-project__inner {
      width: fit-content;

      .c-projects__header {
        font-size: 45px;
      }

      .c-projects__description {
        font-size: 14px;
        text-align: justify;
        width: 800px;
      }

      .c-projects-list {
        width: 800px;

        padding: 22px;

        .c-project {
          &:not(:nth-child(1)) {
            padding-top: 16px;
          }

          &:not(:last-child) {
            padding-bottom: 16px;
          }
        }
      }
    }
  }
}

@media only screen and (max-width: 767px) {
  .c-projects__wrapper {
    padding: 50px;

    .c-project__inner {
      width: fit-content;

      .c-projects__header {
        font-size: 35px;
      }

      .c-projects__description {
        font-size: 14px;
        text-align: justify;
        width: 100%;
      }

      .c-projects-list {
        width: 100%;
        margin-top: 30px;
        .c-project {
          .c-project__right {
            width: 250px;

            .c-project__stats-top {
              margin-bottom: 5px;
              width: 100%;
              align-items: flex-end;

              span {
                font-weight: 500;
                font-size: 11px;
                line-height: 150%;
                letter-spacing: 0.0025em;
                color: rgba(39, 39, 39, 0.8);
              }
              .language-info {
                span {
                  text-transform: uppercase;
                }
                .source-lang {
                  margin-right: 10px;
                }

                .target-lang {
                  margin-left: 10px;
                }
              }
            }
          }
        }
      }
    }
  }
}

@media only screen and (max-width: 480px) {
  .c-projects__wrapper {
    .c-project__inner {
      .c-projects__header {
        font-size: 30px;
      }

      .c-projects__description {
        text-align: center;
      }

      .c-projects-list {
        max-height: fit-content;
        .c-project {
          flex-direction: column;

          .c-project__left {
            .c-project__info {
              h6 {
                font-size: 17px;
              }
            }
          }
          .c-project__right {
            width: 100%;
            margin-top: 20px;

            .c-project__stats-top {
              margin-bottom: 5px;
              width: 100%;
              align-items: flex-end;

              span {
                font-weight: 500;
                font-size: 11px;
                line-height: 150%;
                letter-spacing: 0.0025em;
                color: rgba(39, 39, 39, 0.8);
              }
              .language-info {
                span {
                  text-transform: uppercase;
                }
                .source-lang {
                  margin-right: 10px;
                }

                .target-lang {
                  margin-left: 10px;
                }
              }
            }
          }
        }
      }
    }
  }
}
</style>
