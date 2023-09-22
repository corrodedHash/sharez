import { createApp } from 'vue'
import './assets/style.css'
import App from './App.vue'

import 'vuetify/styles'
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'
import { createVuetify } from 'vuetify'

const vuetify = createVuetify({
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi
    }
  }
})

createApp(App).use(vuetify).mount('#app')
