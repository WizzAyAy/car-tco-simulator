import { createRouter, createWebHistory } from 'vue-router'
import ComparisonPage from './pages/ComparisonPage.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'comparison', component: ComparisonPage },
    {
      path: '/compare',
      name: 'compare-index',
      component: () => import('./pages/CompareIndexPage.vue'),
    },
    {
      path: '/compare/:slugA-vs-:slugB',
      name: 'compare-seo',
      component: () => import('./pages/CompareSeoPage.vue'),
    },
    {
      path: '/recommend',
      name: 'recommend',
      component: () => import('./pages/RecommendPage.vue'),
    },
    {
      path: '/embed',
      name: 'embed',
      component: () => import('./pages/EmbedPage.vue'),
    },
  ],
})
