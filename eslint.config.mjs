import next from "eslint-config-next";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";

const config = [
  ...next,
  {
    files: ["*.config.*", "*.mjs"],
    languageOptions: {
      parser: tsparser,
    },
    rules: {
      "no-console": "error",
      eqeqeq: ["error", "always"],
      "no-nested-ternary": "error",
      "max-lines": [
        "warn",
        {
          max: 250,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    ignores: ["*.config.*", "*.mjs"],
    plugins: {
      "@typescript-eslint": tseslint,
    },
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/explicit-module-boundary-types": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "no-restricted-syntax": [
        "error",
        {
          selector: "TSEnumDeclaration",
          message: "Use string literal unions instead of enums (see docs/CONVENTIONS.md)",
        },
        {
          selector: "ExportDefaultDeclaration",
          message:
            "Use named exports instead of default exports (except for Next.js files: page, layout, loading, error, not-found and config files)",
        },
      ],
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../../*"],
              message: "Use the @/ alias instead of relative imports (see docs/CONVENTIONS.md)",
            },
          ],
        },
      ],
      "no-console": "error",
      eqeqeq: ["error", "always"],
      "no-nested-ternary": "error",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "max-lines": [
        "warn",
        {
          max: 250,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
    },
  },
  {
    files: [
      "src/app/**/page.tsx",
      "src/app/**/layout.tsx",
      "src/app/**/loading.tsx",
      "src/app/**/error.tsx",
      "src/app/**/not-found.tsx",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "TSEnumDeclaration",
          message: "Use string literal unions instead of enums (see docs/CONVENTIONS.md)",
        },
      ],
    },
  },
];

export default config;
