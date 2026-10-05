// greenfield-kit: the four checks oxlint 1.86 doesn't have.
//
// Everything else runs in oxlint (.oxlintrc.json). When oxlint gains one of
// these rules, move it there and delete it here.
//
// Install:
//   bun add -d eslint@^9 @eslint/js@^9 typescript-eslint eslint-plugin-import \
//     eslint-plugin-simple-import-sort @stylistic/eslint-plugin eslint-import-resolver-typescript
//
// To add project rules, rename this file's import and wrap it:
//   import greenfield from "./eslint.greenfield.mjs"
//   export default [...greenfield, { rules: { /* yours */ } }]

import stylistic from "@stylistic/eslint-plugin"
import importPlugin from "eslint-plugin-import"
import simpleImportSort from "eslint-plugin-simple-import-sort"
import tseslint from "typescript-eslint"

// Where the layers live. Change this one line if they aren't under `src/`.
const SRC = "src"

// routes → views → widgets → features → entities → shared. Code may import
// downwards only. server/ is reachable from *.functions.ts alone (oxlint).
const LAYERS = ["routes", "views", "widgets", "features", "entities", "shared"]

const layerMessage = (layer, target) =>
  `${layer}/ may not import ${target}/. Layers import downwards only: ${LAYERS.join(" → ")}. Move the shared piece down a layer.`

// For relative imports the resolver can follow (`../../views/x`), which a
// string pattern in oxlint can't see.
const layerZones = LAYERS.flatMap((layer, index) =>
  LAYERS.slice(0, index).map((target) => ({
    target: `./${SRC}/${layer}`,
    from: `./${SRC}/${target}`,
    message: layerMessage(layer, target),
  })),
)

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/.output/**",
      "**/.tanstack/**",
      "**/coverage/**",
      "**/node_modules/**",
      "**/*.generated.*",
      "**/migrations/**",
      `${SRC}/routeTree.gen.ts`,
    ],
  },

  {
    files: ["**/*.{ts,tsx,js,jsx,mjs}"],
    languageOptions: { parser: tseslint.parser },
    settings: {
      "import/resolver": { typescript: { alwaysTryTypes: true }, node: true },
    },
    plugins: {
      "@stylistic": stylistic,
      "@typescript-eslint": tseslint.plugin,
      import: importPlugin,
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      // Import order — typescript.md, "Import order"
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            ["^\\u0000"], // 1. side effects
            ["^react", "^react-dom", "^@tanstack"], // 2. framework
            ["^@?\\w"], // 3. external packages
            [`^@/(${LAYERS.join("|")}|server)(/|$)`, `^${SRC}/(${LAYERS.join("|")}|server)(/|$)`], // 4. internal layers
            ["^\\.\\.(?!/?$)", "^\\.\\./?$", "^\\./(?=.*/)(?!/?$)", "^\\.(?!/?$)", "^\\./?$"], // 5. relative
            ["^.+\\.s?css$", "^.+\\.(svg|png|jpe?g|webp|gif)$"], // 6. assets last
          ],
        },
      ],
      "simple-import-sort/exports": "error",

      // Layer direction on resolved relative paths — structure.md, "Layers"
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

  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      // Names — typescript.md, "Names"
      "@typescript-eslint/naming-convention": [
        "error",
        { selector: "default", format: ["camelCase"], leadingUnderscore: "allow" },
        {
          selector: "variable",
          format: ["camelCase", "UPPER_CASE", "PascalCase"], // PascalCase: components, zod schemas, Route
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
          format: null, // payloads and route params own their spelling ($orderId)
        },
      ],
    },
  },
)
