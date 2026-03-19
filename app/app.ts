import { createApp } from 'nativescript-vue'
import { createPinia } from 'pinia'
import Home from './pages/Home.vue'

const app = createApp(Home)
app.use(createPinia())
app.start()
