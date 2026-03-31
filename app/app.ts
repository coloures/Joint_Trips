import { createApp, registerElement } from 'nativescript-vue'
import { createPinia } from 'pinia'
import App from './App.vue'

registerElement(
  'DropDown',
  () => require('nativescript-drop-down').DropDown
)

const app = createApp(App)
app.use(createPinia())
app.start()
