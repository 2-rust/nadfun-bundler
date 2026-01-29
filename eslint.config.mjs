import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';

/** @type {import('eslint').Linter.Config[]} */
export default [
    { files: ['**/*.{js,mjs,cjs,ts}'] },
    { languageOptions: { globals: globals.node } },
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
    prettierConfig, // Disable conflicting ESLint rules with Prettier
    {
        plugins: {
            prettier: prettierPlugin, // Add the Prettier plugin
        },
        rules: {
            'prettier/prettier': 'warn', // Show Prettier formatting issues as warnings
            'no-unused-vars': 'warn', // Set no-unused-vars rule to warn
            '@typescript-eslint/no-unused-vars': 'off', // Disable TypeScript-specific no-unused-vars rule
        },
    },
];
