import { defineBaseConfig } from '../../tsup.config.base';

export default defineBaseConfig({
  index: 'src/core/index.ts',
  react: 'src/react/index.ts',
  actions: 'src/actions/index.ts',
  testing: 'src/testing/index.ts',
});
