import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/components/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/home'
      },
      {
        path: 'home',
        name: 'Home',
        component: () => import('@/views/Home.vue')
      },
      {
        path: 'function',
        name: 'Function',
        component: () => import('@/views/Function.vue')
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/Profile.vue')
      }
    ]
  },
  {
    path: '/warehouse',
    name: 'Warehouse',
    component: () => import('@/views/Warehouse.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/item',
    name: 'Item',
    component: () => import('@/views/Item.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/inventory',
    name: 'Inventory',
    component: () => import('@/views/Inventory.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/record',
    name: 'Record',
    component: () => import('@/views/Record.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/scan-out',
    name: 'ScanOut',
    component: () => import('@/views/ScanOut.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/pwa-test',
    name: 'PWATest',
    component: () => import('@/components/PWATestPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/home'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  if (to.meta.requiresAuth && !userStore.token) {
    next('/login')
  } else if (to.path === '/login' && userStore.token) {
    next('/home')
  } else {
    next()
  }
})

export default router
