// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs';

export default withNuxt({
  rules: {
    'vue/multi-word-component-names': 'off',
    'vue/max-attributes-per-line': ['warn', { singleline: 5 }],
    'vue/comma-dangle': 'off',
    'vue/singleline-html-element-content-newline': 'off',
    'vue/html-indent': 'off',
    'vue/no-multiple-template-root': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@stylistic/semi': 'off',
    '@stylistic/comma-dangle': 'off',
    '@stylistic/quotes': 'off',
    '@stylistic/arrow-parens': 'off',
    '@stylistic/operator-linebreak': 'off',
    '@stylistic/member-delimiter-style': 'off',
    '@stylistic/quote-props': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        args: 'all',
        argsIgnorePattern: '^_',
        caughtErrors: 'all',
        caughtErrorsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      },
    ],
  },
});
