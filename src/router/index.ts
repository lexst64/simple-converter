import AuthView from '@/views/AuthView.vue'
import ConverterView from '@/views/ConverterView.vue'
import FeedbackView from '@/views/FeedbackView.vue'
import HistoryView from '@/views/HistoryView.vue'
import MyProfileView from '@/views/MyProfileView.vue'
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(),
  linkActiveClass: 'nav-link-active',
  linkExactActiveClass: 'nav-link-exact-active',
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => HomeView,
      meta: {
        requiresAuth: true,
      },
      // beforeEnter: () => {
      //   const { files } = useFileStore()
      //   if (files.length > 0) return '/converter'
      //   return true
      // },
    },
    {
      path: '/history',
      name: 'history',
      component: HistoryView,
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/profile',
      name: 'profile',
      component: MyProfileView,
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/feedback',
      name: 'feedback',
      component: FeedbackView,
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/auth',
      name: 'auth',
      component: AuthView,
    },
    {
      path: '/converter',
      name: 'converter',
      component: ConverterView,
      meta: {
        requiresAuth: true,
      },
    },
  ],
})

router.beforeEach((to) => {
  if (to.meta.requiresAuth) {
    const token = localStorage.getItem('token')
    if (token) return true
    return '/auth'
  }
  return true
})

export default router
