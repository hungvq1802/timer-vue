import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import Multiselect from 'vue-multiselect';
import 'vue-multiselect/dist/vue-multiselect.css';

const app = createApp(App);

app.component('multiselect', Multiselect);

app.mount('#app');

