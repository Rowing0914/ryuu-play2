module.exports = {
    'env': {
        'browser': true,
        'es2021': true
    },
    'extends': [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended'
    ],
    'parser': '@typescript-eslint/parser',
    'parserOptions': {
        'ecmaVersion': 'latest',
        'sourceType': 'module'
    },
    'plugins': [
        '@typescript-eslint'
    ],
    'rules': {
        'indent': ['error', 2, { 'SwitchCase': 1 }],
        'linebreak-style': ['error', 'unix'],
        'prefer-rest-params': 'off',
        'require-yield': 'off',
        'quotes': ['error', 'single'],
        'semi': ['error', 'always'],
        '@typescript-eslint/ban-types': ['error',
            {
                types: {
                    'Object': false,
                    'Function': false
                },
                'extendDefaults': true
            }
        ],
        '@typescript-eslint/no-unused-vars': ['error',
            {
              'vars': 'all',
              'args': 'none',
              'ignoreRestSiblings': false
            }
        ],
        '@typescript-eslint/no-inferrable-types': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-empty-function': 'off'
    }
};
