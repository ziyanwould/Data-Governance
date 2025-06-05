import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import AppLayout from '@/layouts/AppLayout.vue';
import DataAccessView from '@/views/DataAccessView.vue';
import DataAggregationView from '@/views/DataAggregationView.vue';
import DataQualityView from '@/views/DataQualityView.vue';
import DataCleansingView from '@/views/DataCleansingView.vue';
import MetadataManagementView from '@/views/MetadataManagementView.vue';
import DataApiView from '@/views/DataApiView.vue';
import DashboardView from '@/views/DashboardView.vue';

// Placeholder components for routes that are not yet implemented // This line will be removed
// const createPlaceholderComponent = (name: string) => ({ // This line will be removed
//   template: `<div><h2>${name} Page</h2><p>Content will be implemented here.</p></div>`, // This line will be removed
//   name: name.replace(/\s+/g, '') + 'Page' // This line will be removed
// }); // This line will be removed

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    component: AppLayout,
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'Dashboard', component: DashboardView },
      { path: 'data-access', name: 'DataAccess', component: DataAccessView },
      { path: 'data-aggregation', name: 'DataAggregation', component: DataAggregationView },
      { path: 'data-quality', name: 'DataQuality', component: DataQualityView },
      { path: 'data-cleansing', name: 'DataCleansing', component: DataCleansingView },
      { path: 'metadata-management', name: 'MetadataManagement', component: MetadataManagementView },
      { path: 'data-api', name: 'DataApi', component: DataApiView },
    ]
  }
];

// createPlaceholderComponent function is now removed as it's no longer used.

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

export default router;
