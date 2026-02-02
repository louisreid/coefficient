import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const customJestConfig = {
  testEnvironment: "jsdom",
  setupFiles: ["<rootDir>/jest.env.ts"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testPathIgnorePatterns: [
    "/node_modules/",
    "/.next/",
    "<rootDir>/src/__tests__/setup/",
  ],
  transformIgnorePatterns: [
    "/node_modules/(?!(@auth/prisma-adapter)/)",
  ],
};

export default createJestConfig(customJestConfig);
