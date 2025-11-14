import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'

const app = createApp(App)
app.use(createPinia())
app.use(VueQueryPlugin)
app.mount('#app')
