import { App } from './App.js'
import { createApp } from '../dist/mini-vue.esm.js'

const rootConatiner = document.getElementById('app')
createApp(App).mount(rootConatiner)
