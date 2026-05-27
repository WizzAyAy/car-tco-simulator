// vite.config.ts
import { fileURLToPath, URL } from "node:url";
import tailwindcss from "file:///home/quentin/car-tco-simulator/node_modules/.pnpm/@tailwindcss+vite@4.3.0_vite@6.4.2_@types+node@22.19.19_jiti@2.7.0_lightningcss@1.32.0_tsx@4.22.3_yaml@2.9.0_/node_modules/@tailwindcss/vite/dist/index.mjs";
import vue from "file:///home/quentin/car-tco-simulator/node_modules/.pnpm/@vitejs+plugin-vue@5.2.4_vite@6.4.2_@types+node@22.19.19_jiti@2.7.0_lightningcss@1.32.0_59cd2b9476562b35172511a09d2b2c09/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import { defineConfig } from "file:///home/quentin/car-tco-simulator/node_modules/.pnpm/vite@6.4.2_@types+node@22.19.19_jiti@2.7.0_lightningcss@1.32.0_tsx@4.22.3_yaml@2.9.0/node_modules/vite/dist/node/index.js";
var __vite_injected_original_import_meta_url = "file:///home/quentin/car-tco-simulator/apps/web/vite.config.ts";
var vite_config_default = defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      "~": fileURLToPath(new URL("./src", __vite_injected_original_import_meta_url))
    }
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5174",
        changeOrigin: true
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          echarts: ["echarts/core", "echarts/charts", "echarts/components", "echarts/renderers", "vue-echarts"],
          vue: ["vue", "vue-router", "pinia"]
        }
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9xdWVudGluL2Nhci10Y28tc2ltdWxhdG9yL2FwcHMvd2ViXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9xdWVudGluL2Nhci10Y28tc2ltdWxhdG9yL2FwcHMvd2ViL3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3F1ZW50aW4vY2FyLXRjby1zaW11bGF0b3IvYXBwcy93ZWIvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBmaWxlVVJMVG9QYXRoLCBVUkwgfSBmcm9tICdub2RlOnVybCdcbmltcG9ydCB0YWlsd2luZGNzcyBmcm9tICdAdGFpbHdpbmRjc3Mvdml0ZSdcbmltcG9ydCB2dWUgZnJvbSAnQHZpdGVqcy9wbHVnaW4tdnVlJ1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW3Z1ZSgpLCB0YWlsd2luZGNzcygpXSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICAnfic6IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLi9zcmMnLCBpbXBvcnQubWV0YS51cmwpKSxcbiAgICB9LFxuICB9LFxuICBzZXJ2ZXI6IHtcbiAgICBwb3J0OiA1MTczLFxuICAgIHByb3h5OiB7XG4gICAgICAnL2FwaSc6IHtcbiAgICAgICAgdGFyZ2V0OiAnaHR0cDovL2xvY2FsaG9zdDo1MTc0JyxcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxuICBidWlsZDoge1xuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIG91dHB1dDoge1xuICAgICAgICBtYW51YWxDaHVua3M6IHtcbiAgICAgICAgICBlY2hhcnRzOiBbJ2VjaGFydHMvY29yZScsICdlY2hhcnRzL2NoYXJ0cycsICdlY2hhcnRzL2NvbXBvbmVudHMnLCAnZWNoYXJ0cy9yZW5kZXJlcnMnLCAndnVlLWVjaGFydHMnXSxcbiAgICAgICAgICB2dWU6IFsndnVlJywgJ3Z1ZS1yb3V0ZXInLCAncGluaWEnXSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbn0pXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQTBTLFNBQVMsZUFBZSxXQUFXO0FBQzdVLE9BQU8saUJBQWlCO0FBQ3hCLE9BQU8sU0FBUztBQUNoQixTQUFTLG9CQUFvQjtBQUgySixJQUFNLDJDQUEyQztBQUt6TyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTLENBQUMsSUFBSSxHQUFHLFlBQVksQ0FBQztBQUFBLEVBQzlCLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssY0FBYyxJQUFJLElBQUksU0FBUyx3Q0FBZSxDQUFDO0FBQUEsSUFDdEQ7QUFBQSxFQUNGO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixPQUFPO0FBQUEsTUFDTCxRQUFRO0FBQUEsUUFDTixRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsTUFDaEI7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsZUFBZTtBQUFBLE1BQ2IsUUFBUTtBQUFBLFFBQ04sY0FBYztBQUFBLFVBQ1osU0FBUyxDQUFDLGdCQUFnQixrQkFBa0Isc0JBQXNCLHFCQUFxQixhQUFhO0FBQUEsVUFDcEcsS0FBSyxDQUFDLE9BQU8sY0FBYyxPQUFPO0FBQUEsUUFDcEM7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
