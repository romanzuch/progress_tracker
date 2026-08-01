<script setup lang="ts">
import { onMounted } from "vue"
import { useRouter } from "vue-router"
import { useSessionStore } from "../stores/session.store"

const router = useRouter()
const sessionStore = useSessionStore()

onMounted(() => {
  sessionStore.markAuthenticated()
  router.replace({ name: "home" })
})
</script>

<template>
  <h1>Signing you in&hellip;</h1>
</template>
