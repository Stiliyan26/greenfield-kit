/** Backend import rules. Copy to <backend>/.dependency-cruiser.cjs; run with `depcruise src`. */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      comment:
        'Circular imports. Allowed: cycles made only of `import type`, and entity ↔ entity relations (TypeORM resolves them lazily).',
      severity: 'error',
      from: { pathNot: '\\.entity\\.ts$' },
      to: { circular: true, viaOnly: { dependencyTypesNot: ['type-only'] } },
    },
    {
      name: 'no-client-code',
      comment: 'The server never imports client code',
      severity: 'error',
      from: {},
      to: { path: '(^|/)client/' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.json' },
    tsPreCompilationDeps: true,
  },
};
