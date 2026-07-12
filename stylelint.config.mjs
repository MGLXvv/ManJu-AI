export default {
  extends: ['stylelint-config-standard-scss'],
  ignoreFiles: ['artifacts/**', 'coverage/**', 'dist/**', 'node_modules/**', 'src/assets/iconfont/**'],
  rules: {
    'color-function-notation': null,
    'declaration-block-no-redundant-longhand-properties': null,
    'no-descending-specificity': null,
    'selector-class-pattern': null,
  },
}
