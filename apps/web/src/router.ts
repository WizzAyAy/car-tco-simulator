import { createRouter, createWebHistory } from 'vue-router'
import ComparisonPage from './pages/ComparisonPage.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'comparison', component: ComparisonPage },
  ],
})
