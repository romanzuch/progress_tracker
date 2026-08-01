<script setup lang="ts">
import { redirectToBattlenetLogin } from "../lib/auth"
</script>

<template>
  <div>
    <h1>Login</h1>
    <p>Sign in with your Battle.net account to track characters and view their progress.</p>
    <button type="button" @click="redirectToBattlenetLogin">Log in with Battle.net</button>
  </div>
</template>
