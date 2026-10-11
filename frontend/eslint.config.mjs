import { defineConfig, globalIgnores } from "eslint/config";
import nextPlugin from "@next/eslint-plugin-next";
import tseslint from "typescript-eslint";

const eslintConfig = defineConfig([
  nextPlugin.configs["core-web-vitals"],
  ...tseslint.configs.recommended,
  // Ignore generated files.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "venv/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
