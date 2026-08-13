import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages はリポジトリ名のサブパスで配信される
  // (https://<user>.github.io/<repo>/)。base が "/" のままだと生成される
  // アセットの参照が絶対パスになり、公開先で 404 になって白画面だけが残る。
  // これはローカルでは再現しないので、デプロイのワークフローで明示的に渡す。
  base: process.env.BASE_PATH || "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
