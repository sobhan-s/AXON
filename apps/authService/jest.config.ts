import type { Config } from 'jest';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const baseConfig: Config = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],

  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },

  transformIgnorePatterns: ['node_modules/(?!(@dam)/)'],

  testMatch: ['**/*.spec.ts'],
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/repository/**',
    '!src/routes/**',
    '!src/app.ts',
    '!src/index.ts',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
};

export default {
  ...baseConfig,
  rootDir: __dirname,
  coverageDirectory: 'coverage',
};
