/** @type {import('jest').Config} */
const shared = {
  moduleNameMapper: {
    '^jest-canvas-mock-compare/constants$': '<rootDir>/../jest-canvas-mock-compare/src/constants.ts',
    '^jest-canvas-mock-compare$': '<rootDir>/../jest-canvas-mock-compare/src/index.ts',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.jest.json',
      },
    ],
  },
};

module.exports = {
  projects: [
    {
      displayName: 'client',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/src/**/*.test.ts', '<rootDir>/src/**/*.test.tsx'],
      setupFiles: ['jest-canvas-mock'],
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
      ...shared,
    },
    {
      displayName: 'server',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/server/**/*.test.ts'],
      ...shared,
    },
  ],
};
