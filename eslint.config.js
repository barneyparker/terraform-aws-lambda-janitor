import globals from 'globals'
import js from '@eslint/js'
import jsdoc from 'eslint-plugin-jsdoc'

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      jsdoc: jsdoc,
    },
    rules: {
      'require-await': 'error',
      'no-return-await': 'error',
      // (a) => a not a => a
      'arrow-parens': [
        'error',
        'always',
      ],
      // } else { not }\n else {
      'brace-style': [
        'error',
        '1tbs',
        {
          allowSingleLine: true,
        },
      ],
      // last item in a list should not have a comma at the end
      'comma-dangle': [
        'error',
        {
          arrays: 'always-multiline',
          objects: 'always-multiline',
          imports: 'never',
          exports: 'never',
          functions: 'never',
        },
      ],
      // [a, b] not [a,b]  or [a ,b]
      'comma-spacing': [
        'error',
        {
          before: false,
          after: true,
        },
      ],
      // commas go at the end of a line, not the start
      'comma-style': [
        'error',
        'last',
      ],
      // if (a) { a++ } not if (a) a++
      curly: [
        'error',
      ],
      // allow async-await
      'generator-star-spacing': [
        'off',
      ],
      // 2 space indentation (should match .editorconfig)
      indent: [
        'error',
        2,
        {
          SwitchCase: 1,
        },
      ],
      'linebreak-style': [
        'error',
        'unix',
      ],
      // { key: value } not { key:value }
      'key-spacing': [
        'error',
        {
          afterColon: true,
          beforeColon: false,
        },
      ],
      // { key: value } not {key: value}
      'keyword-spacing': [
        0,
        {
          before: true,
          after: true,
        },
      ],
      // let a = 1; not let a =     1;
      'no-multi-spaces': [
        'error',
      ],
      // No empty lines at top or bottom or file (except 1 EOF for git)
      // and no more than 2 empty returns in a file
      'no-multiple-empty-lines': [
        'error',
        {
          max: 2,
          maxBOF: 0,
          maxEOF: 0,
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Property[method="true"]',
          message: 'No shortform methods. x: function (). not x()',
        },
      ],
      // Remove unused defined variables
      'no-unused-vars': [
        'error',
      ],
      // Don't reference a variable that is not defined
      'no-undef': [
        'error',
      ],
      // Only allow let and const, no var
      'no-var': [
        'error',
      ],
      // Curly braces start and end should match in a sane way
      'object-curly-spacing': [
        'error',
        'always',
      ],
      // Consistent operator placement on multiple lines
      'operator-linebreak': [
        'error',
        'after',
      ],
      // Define each variable on it's own line
      'one-var': [
        'error',
        'never',
      ],
      // Don't have returns as the first or last character in a function or if statement
      'padded-blocks': [
        'error',
        'never',
      ],
      // Single quotes are used by ~80% of the JS community
      quotes: [
        'error',
        'single',
      ],
      // Only require quotes around object keys that need them
      'quote-props': [
        'error',
        'as-needed',
      ],
      semi: [
        'error',
        'never',
      ],
      // if (a) {} not if (a){}
      'space-before-blocks': [
        'error',
        'always',
      ],
      // function name () {} not function name() {}
      'space-before-function-paren': [
        1,
        'always',
      ],
      // a(b) not a( b )
      'space-in-parens': [
        'error',
        'never',
      ],
      // 1 + 2 not 1+2
      'space-infix-ops': [
        'error',
      ],
      // Comments begin with a space
      'spaced-comment': [
        'error',
        'always',
      ],
      'jsdoc/check-access': 1,
      'jsdoc/check-alignment': 1,
      // Turn on after https://github.com/eslint/eslint/issues/14745 resolved
      'jsdoc/check-examples': 0,
      'jsdoc/check-indentation': 0,
      'jsdoc/check-line-alignment': [
        1,
        'always',
        {
          tags: [
            'arg',
            'argument',
            'callback',
            'param',
            'property',
            'prop',
            'returns',
            'return',
          ],
          customSpacings: {
            postDelimiter: 1,
            postTag: 1,
            postType: 1,
            postName: 2,
          },
        },
      ],
      'jsdoc/check-param-names': 1,
      'jsdoc/check-property-names': 1,
      'jsdoc/check-syntax': 1,
      'jsdoc/check-tag-names': 1,
      'jsdoc/check-types': 1,
      'jsdoc/check-values': 1,
      'jsdoc/empty-tags': 1,
      'jsdoc/implements-on-classes': 1,
      'jsdoc/match-description': ['error', { matchDescription: '[A-Z].*' }],
      'jsdoc/no-bad-blocks': 1,
      'jsdoc/no-defaults': 1,
      'jsdoc/no-types': 0,
      'jsdoc/no-undefined-types': 1,
      'jsdoc/require-description': 1,
      'jsdoc/require-description-complete-sentence': 0,
      'jsdoc/require-example': 0,
      'jsdoc/require-file-overview': 0,
      'jsdoc/require-hyphen-before-param-description': 0,
      'jsdoc/require-jsdoc': [
        1,
        {
          /* publicOnly: {
            ancestorsOnly: false,
            cjs: true,
            esm: true,
            window: true,
          }, */
          require: {
            ArrowFunctionExpression: true,
            ClassDeclaration: true,
            ClassExpression: true,
            FunctionDeclaration: true,
            FunctionExpression: true,
            MethodDefinition: true,
          },
        },
      ],
      'jsdoc/require-param': 1,
      'jsdoc/require-param-description': 1,
      'jsdoc/require-param-name': 1,
      'jsdoc/require-param-type': 1,
      'jsdoc/require-property': 1,
      'jsdoc/require-property-description': 1,
      'jsdoc/require-property-name': 1,
      'jsdoc/require-property-type': 1,
      'jsdoc/require-returns': 1,
      'jsdoc/require-returns-check': 1,
      'jsdoc/require-returns-description': 1,
      'jsdoc/require-returns-type': 1,
      'jsdoc/tag-lines': [
        1,
        'always',
        {
          count: 0,
          startLines: 1,
          applyToEndTag: false,
          tags: {
            example: {
              count: 1,
              lines: 'always',
            },
          },
        },
      ],
      'jsdoc/valid-types': 1,
    },
  },
]