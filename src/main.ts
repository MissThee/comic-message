import { createApp } from 'vue'
import App from './App.vue'
import 'vant/lib/index.css';
import vant from 'vant'
const app = createApp(App)

app.use(vant)

app.mount('#app')
