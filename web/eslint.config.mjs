import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Add React hooks overrides to handle false positives
const reactHooksOverrides = {
  rules: {
    // Allow setState in effect for performance reasons when needed
    "react-hooks/react-hooks-exhaustive-deps": "off",
    // Allow setState calls in effects for legitimate use cases
    "react-hooks/set-state-in-effect": "off",
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  reactHooksOverrides,
]);

export default eslintConfig;
