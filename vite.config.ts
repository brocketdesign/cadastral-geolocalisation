import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig(async ({ command }) => {
  const plugins: import('vite').PluginOption[] = [react()];
  if (command === 'serve') {
    const { inspectAttr } = await import('kimi-plugin-inspect-react');
    plugins.unshift(inspectAttr());
  }
  return {
    base: '/',
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
