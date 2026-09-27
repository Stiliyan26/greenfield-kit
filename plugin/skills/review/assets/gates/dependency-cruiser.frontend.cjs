/** Frontend import rules: app → pages → features → entities → shared. Copy to <frontend>/.dependency-cruiser.cjs; run with `depcruise src`. */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      comment:
        'Circular imports (a cycle made only of `import type` is allowed)',
      severity: 'error',
      from: {},
      to: { circular: true, viaOnly: { dependencyTypesNot: ['type-only'] } },
    },
    {
      name: 'no-import-up',
      comment:
        'A lower folder may not import a higher one (app → pages → features → entities → shared)',
      severity: 'error',
      from: { path: '^src/(pages|features|entities|shared)/' },
      to: { path: '^src/app/' },
    },
    {
      name: 'no-import-pages',
      severity: 'error',
      from: { path: '^src/(features|entities|shared)/' },
      to: { path: '^src/pages/' },
    },
    {
      name: 'no-import-features',
      severity: 'error',
      from: { path: '^src/(entities|shared)/' },
      to: { path: '^src/features/' },
    },
    {
      name: 'no-import-entities',
      severity: 'error',
      from: { path: '^src/shared/' },
      to: { path: '^src/entities/' },
    },
    {
      name: 'feature-public-api',
      comment: 'Another feature is imported only through its index.ts',
      severity: 'error',
      from: { path: '^src/features/([^/]+)/' },
      to: {
        path: '^src/features/',
        pathNot: ['^src/features/$1/', '^src/features/[^/]+/index\\.ts$'],
      },
    },
    {
      name: 'entity-public-api',
      comment: 'Another entity is imported only through its index.ts',
      severity: 'error',
      from: { path: '^src/entities/([^/]+)/' },
      to: {
        path: '^src/entities/',
        pathNot: ['^src/entities/$1/', '^src/entities/[^/]+/index\\.ts$'],
      },
    },
    {
      name: 'no-server-code',
      comment: 'The browser never imports server code',
      severity: 'error',
      from: {},
      to: { path: '(^|/)server/' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '\\.(scss|css|svg|png|jpe?g|webp)$' },
    tsConfig: { fileName: 'tsconfig.app.json' },
    tsPreCompilationDeps: true,
  },
};
