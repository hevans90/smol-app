import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: [
    {
      'https://smol-hasura.fly.dev/v1/graphql': {
        headers: {
          'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET,
        } as any,
      },
    },
  ],
  documents: ['src/graphql/**/*.graphql'],
  generates: {
    './src/graphql-api.ts': {
      plugins: [
        'typescript',
        'typescript-operations',
        'typescript-react-apollo',
        'fragment-matcher',
      ],
      config: {
        skipTypename: false,
        withHooks: false,
        withHOC: false,
        withComponent: false,
        scalars: {
          _numeric: 'number[]',
          _text: 'string[]',
          _uuid: 'string[]',
          numeric: 'number',
          timestamp: 'string',
          timestamptz: 'string',
          uuid: 'string',
        },
      },
    },
    './graphql.schema.json': {
      plugins: ['introspection'],
    },
  },
};

export default config;
