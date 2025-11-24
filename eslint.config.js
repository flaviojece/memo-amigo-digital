import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      
      // ✅ ATIVAR: Detectar variáveis não usadas
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",      // Ignora args que começam com _
          varsIgnorePattern: "^_",      // Ignora vars que começam com _
          caughtErrorsIgnorePattern: "^_", // Ignora erros em catch
        },
      ],
      
      // ✅ ADICIONAR: Avisar sobre uso de 'any'
      "@typescript-eslint/no-explicit-any": "warn",
      
      // ✅ ADICIONAR: Avisar sobre dependências faltantes em useEffect
      "react-hooks/exhaustive-deps": "warn",
      
      // ✅ ADICIONAR: Preferir const sobre let
      "prefer-const": "error",
      
      // ✅ ADICIONAR: Evitar console.log em produção
      "no-console": ["warn", { allow: ["error"] }],
    },
  }
);
