module.exports = {
  // https://www.conventionalcommits.org/en/v1.0.0/
  extends: ['@commitlint/config-conventional'],
  rules: {
    //   TODO Add Scope Enum Here
    // 'scope-enum': [2, 'always', ['yourscope', 'yourscope']],
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'chore',
        'style',
        'refactor',
        'build',
        'test',
        'perf',
        'revert',
        'init',
      ],
    ],
  },
};
