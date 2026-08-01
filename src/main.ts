import { createApp } from "vue"
import { createPinia } from "pinia"
import "./style.css"
import App from "./App.vue"
import { router } from "./router/index.ts"
import { setUnauthorizedHandler } from "../lib/api/client"

setUnauthorizedHandler(() => {
    if (router.currentRoute.value.name !== "login") {
        router.push({ name: "login" })
    }
})

createApp(App)
    .use(createPinia())
    .use(router)
    .mount("#app")
