// greenfield-kit code rules, as checks.
//
// Every rule here replaces a line someone would otherwise have to remember.
// The prose that a linter can't check lives in the `write-code` skill.
//
// Install the packages this needs:
//   npm i -D eslint@^9 @eslint/js@^9 typescript-eslint eslint-plugin-import \
//     eslint-plugin-simple-import-sort eslint-plugin-unused-imports \
//     eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-jsx-a11y \
//     @stylistic/eslint-plugin eslint-import-resolver-typescript
//
// To add project rules, rename this file's import and wrap it:
//   import greenfield from "./eslint.greenfield.mjs"
//   export default [...greenfield, { rules: { /* yours */ } }]

import js from "@eslint/js"
import stylistic from "@stylistic/eslint-plugin"
import importPlugin from "eslint-plugin-import"
import jsxA11y from "eslint-plugin-jsx-a11y"
import react from "eslint-plugin-react"
import reactHooks from "eslint-plugin-react-hooks"
import simpleImportSort from "eslint-plugin-simple-import-sort"
import unusedImports from "eslint-plugin-unused-imports"
import tseslint from "typescript-eslint"

// Where the frontend layers live. Change this one line if the project puts
// them somewhere other than `src/`.
const SRC = "src"

// app → pages → features → entities → shared. Code may import to its right,
// never to its left.
const LAYERS = ["app", "pages", "features", "entities", "shared"]

const layerMessage = (layer, target) =>
  `${layer}/ may not import ${target}/. Layers import to the right only: ${LAYERS.join(" → ")}. Move the shared piece down a layer.`

// For imports the resolver can follow (relative paths, real files).
const layerZones = LAYERS.flatMap((layer, index) =>
  LAYERS.slice(0, index).map((target) => ({
    target: `./${SRC}/${layer}`,
    from: `./${SRC}/${target}`,
    message: layerMessage(layer, target),
  })),
)

// Reaching past a sibling's index.ts — structure.md, "Frontend layers".
const DEEP_REACH = {
  group: ["@/features/*/*/**", "@/entities/*/*/**"],
  message: "Import a feature or entity through its index.ts, not its inner files. See write-code/references/structure.md.",
}

// For imports written as an alias (`@/app/…`), which a resolver may not follow.
// One block per layer, because each layer forbids a different set. ESLint
// replaces a rule's options rather than merging them, so every block has to
// carry the deep-reach pattern too.
const layerImportBlocks = LAYERS.map((layer, index) => ({
  files: [`**/${SRC}/${layer}/**/*.{ts,tsx,js,jsx}`],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          DEEP_REACH,
          ...LAYERS.slice(0, index).map((target) => ({
            group: [`@/${target}`, `@/${target}/*`, `${SRC}/${target}`, `${SRC}/${target}/*`, `**/${SRC}/${target}/*`],
            message: layerMessage(layer, target),
          })),
        ],
      },
    ],
  },
}))

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
      "**/node_modules/**",
      "**/.next/**",
      "**/*.generated.*",
      "**/migrations/**",
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  // ---------------------------------------------------------------- every file
  {
    files: ["**/*.{ts,tsx,js,jsx,mjs}"],
    settings: {
      // Without this, import/no-restricted-paths silently skips every `@/…`
      // import, because it cannot resolve the alias to a file.
      "import/resolver": { typescript: { alwaysTryTypes: true }, node: true },
    },
    plugins: {
      "@stylistic": stylistic,
      import: importPlugin,
      "simple-import-sort": simpleImportSort,
      "unused-imports": unusedImports,
    },
    rules: {
      // Flat control flow — typescript.md, "Flat control flow"
      "no-nested-ternary": "error",
      "max-depth": ["error", 2],
      "no-else-return": ["error", { allowElseIf: false }],

      // File size — structure.md, "Splitting a file". 350 is the point to ask
      // yourself; 450 is the limit.
      "max-lines": ["error", { max: 450, skipBlankLines: true, skipComments: true }],

      // Remove what the change left unused — INSTRUCTIONS.md, "Before changing code"
      "unused-imports/no-unused-imports": "error",
      // unused-imports owns this one, so nothing is reported twice.
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-vars": [
        "warn",
        { args: "after-used", argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],

      // Import order — typescript.md, "Import order"
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            ["^\\u0000"], // 1. side effects
            ["^react", "^react-dom", "^react-router", "^@nestjs"], // 2. framework
            ["^@?\\w"], // 3. external packages
            [`^@/(${LAYERS.join("|")})(/|$)`, `^${SRC}/(${LAYERS.join("|")})(/|$)`], // 4. internal layers
            ["^\\.\\.(?!/?$)", "^\\.\\./?$", "^\\./(?=.*/)(?!/?$)", "^\\.(?!/?$)", "^\\./?$"], // 5. relative
            ["^.+\\.s?css$", "^.+\\.(svg|png|jpe?g|webp|gif)$"], // 6. assets last
          ],
        },
      ],
      "simple-import-sort/exports": "error",

      // Named exports — typescript.md, "Names"
      "import/no-default-export": "error",

      // No import loops, no dead paths — structure.md, "Frontend layers"
      "import/no-cycle": ["error", { maxDepth: 4 }],
      "import/no-self-import": "error",

      // Layer direction — structure.md, "Frontend layers". Two checks, because
      // no-restricted-paths only sees imports the resolver can follow, and
      // no-restricted-imports only sees the literal string.
      "import/no-restricted-paths": ["error", { zones: layerZones }],

      // Blank line between block-level siblings — typescript.md
      "@stylistic/padding-line-between-statements": [
        "error",
        { blankLine: "always", prev: "*", next: "return" },
        { blankLine: "always", prev: ["const", "let"], next: "*" },
        { blankLine: "any", prev: ["const", "let"], next: ["const", "let"] },
        { blankLine: "always", prev: "*", next: ["if", "for", "while", "switch", "try", "function", "class"] },
        { blankLine: "always", prev: ["if", "for", "while", "switch", "try", "function", "class"], next: "*" },
      ],
    },
  },

  // ------------------------------------------------------------ TypeScript only
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      // No cast unless the value was checked — SKILL.md, "The rules that need a person"
      "@typescript-eslint/consistent-type-assertions": [
        "error",
        { assertionStyle: "as", objectLiteralTypeAssertions: "never" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",

      // Names — typescript.md, "Names"
      "@typescript-eslint/naming-convention": [
        "error",
        { selector: "default", format: ["camelCase"], leadingUnderscore: "allow" },
        {
          selector: "variable",
          format: ["camelCase", "UPPER_CASE", "PascalCase"], // PascalCase: components
          leadingUnderscore: "allow",
        },
        { selector: "function", format: ["camelCase", "PascalCase"] }, // PascalCase: components
        { selector: "parameter", format: ["camelCase"], leadingUnderscore: "allow" },
        { selector: "typeLike", format: ["PascalCase"] },
        {
          selector: "interface",
          format: ["PascalCase"],
          custom: { regex: "^I[A-Z]", match: false }, // no `I` prefix
        },
        { selector: "enumMember", format: ["PascalCase", "UPPER_CASE"] },
        {
          selector: ["objectLiteralProperty", "typeProperty"],
          format: null, // API payloads own their spelling
        },
      ],
    },
  },

  // ------------------------------------------------------------------ React
  {
    files: ["**/*.{jsx,tsx}"],
    plugins: { react, "react-hooks": reactHooks, "jsx-a11y": jsxA11y },
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: "detect" } },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,

      // Breaks reconciliation — react.md, "Performance"
      "react/no-unstable-nested-components": ["error", { allowAsProps: true }],

      // `0 && <x/>` renders a 0 — react.md, "Performance"
      "react/jsx-no-leaked-render": ["error", { validStrategies: ["ternary"] }],

      "react/jsx-key": ["error", { checkFragmentShorthand: true }],
      "react/self-closing-comp": "error",
      "react/jsx-no-useless-fragment": ["error", { allowExpressions: true }],
    },
  },

  // -------------------------------------------------- no magic route/API strings
  // typescript.md, "No magic strings". Components and hooks never hold a path.
  {
    files: [`**/${SRC}/{app,pages,features}/**/*.{ts,tsx}`],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[value=/^\\/api\\//]",
          message: "Use a path constant from shared/api, called through the entity's api.ts. See write-code/references/typescript.md.",
        },
        {
          selector: "TemplateElement[value.raw=/^\\/api\\//]",
          message: "Use a path constant from shared/api, called through the entity's api.ts. See write-code/references/typescript.md.",
        },
        {
          selector: "CallExpression[callee.name='navigate'] > Literal[value=/^\\//]",
          message: "Use a route constant from app/routes, not a literal path.",
        },
        {
          selector: "JSXAttribute[name.name='to'] > Literal[value=/^\\//]",
          message: "Use a route constant from app/routes, not a literal path.",
        },
      ],
    },
  },

  // ---------------------------------------------------------------- NestJS
  {
    files: ["**/*.controller.ts", "**/*.resolver.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Decorator[expression.callee.name=/^(Controller|Get|Post|Put|Patch|Delete)$/] Literal",
          message: "Route paths live in the feature's *.enums.ts, not inline. See write-code/references/typescript.md.",
        },
      ],
    },
  },

  ...layerImportBlocks,

  // ------------------------------------------------- files a framework owns
  // Config, route and entry files must default-export. Tests and data tables
  // are allowed to be long.
  {
    files: [
      "**/*.config.{ts,js,mjs}",
      "**/main.ts",
      "**/*.d.ts",
      `**/${SRC}/pages/**`,
      "**/app/**/{page,layout,route,loading,error,not-found}.tsx",
    ],
    rules: { "import/no-default-export": "off" },
  },
  {
    files: ["**/*.{test,spec}.{ts,tsx}", "**/*.fixtures.ts", "**/*.seed.ts", "**/__tests__/**"],
    rules: {
      "max-lines": "off",
      "max-depth": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "no-restricted-syntax": "off",
    },
  },
)
