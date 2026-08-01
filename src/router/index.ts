import { createRouter, createWebHistory } from "vue-router"
import HomeView from "../views/HomeView.vue"
import LoginView from "../views/LoginView.vue"
import AuthCallbackView from "../views/AuthCallbackView.vue"
import CharactersAddView from "../views/CharactersAddView.vue"
import CharacterDetailView from "../views/CharacterDetailView.vue"
import SettingsView from "../views/SettingsView.vue"
import NotFoundView from "../views/NotFoundView.vue"

export const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        { path: "/", name: "home", component: HomeView },
        { path: "/login", name: "login", component: LoginView },
        { path: "/auth/callback", name: "auth-callback", component: AuthCallbackView },
        { path: "/characters/add", name: "characters-add", component: CharactersAddView },
        { path: "/characters/:realmSlug/:characterName", name: "character-detail", component: CharacterDetailView },
        { path: "/settings", name: "settings", component: SettingsView },
        { path: "/:pathMatch(.*)*", name: "not-found", component: NotFoundView },
    ],
})