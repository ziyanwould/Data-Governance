import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './assets/main.css' // Global styles

// Import and initialize Mock.js for development environment
if (import.meta.env.DEV) {
  import('./mock').then((mockModule) => {
    // You can call any setup function from mockModule if needed
    // For example: mockModule.setupMocks();
    // But often, just importing is enough if Mock.js setup is self-executing in mock/index.ts
    console.log('Mock.js module loaded.');
  }).catch(err => {
    console.error('Failed to load Mock.js module:', err);
  });
}

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ElementPlus)

app.mount('#app')
