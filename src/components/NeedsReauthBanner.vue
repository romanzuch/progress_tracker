<script setup lang="ts">
import { useSessionStore } from "../stores/session.store"
import { redirectToBattlenetLogin } from "../lib/auth"

const sessionStore = useSessionStore()
</script>

<template>
  <div
    v-if="sessionStore.needsReauth"
    role="alert"
    class="bg-amber-100 text-amber-900 px-4 py-2 text-sm flex items-center justify-between gap-4"
  >
    <span>Your Battle.net session has expired. Log in again to keep tracking characters.</span>
    <button type="button" class="underline" @click="redirectToBattlenetLogin">Log in again</button>
  </div>
</template>
