import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json',
    }],
  },
  setupFilesAfterSetup: ['<rootDir>/tests/jest.setup.ts'],
  moduleNameMapper: {
    '^@egx/shared$': '<rootDir>/../../packages/shared/src',
  },
  testMatch: ['**/*.test.ts'],
  testTimeout: 30000,
  verbose: true,
};

export default config;
