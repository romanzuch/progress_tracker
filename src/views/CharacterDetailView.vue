<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <h1>Character Detail</h1>
  <p>{{ route.params.realmSlug }} / {{ route.params.characterName }}</p>
</template>