import { defineConfig } from "umi";

export default defineConfig({
  routes: [
    { path: "/", component: "index" },
    { path: "/blogs/new", component: "blogs/new" },
    { path: "/blogs/:id", component: "blogs/[id]" },
    { path: "/docs", component: "docs" },
  ],
  proxy: {
    "/api": {
      target: "http://localhost:8080",
      changeOrigin: true,
    },
  },
  npmClient: 'pnpm',
  // utoopack: {},
});
