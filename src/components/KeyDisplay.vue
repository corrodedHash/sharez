<template>
  <div v-if="jwk !== undefined">
    <span>{{ jwk.x }}</span>
  </div>
  <div v-else>Loading key...</div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{ ckey: CryptoKey }>()

const jwk = ref(undefined as JsonWebKey | undefined)
watch(
  () => props.ckey,
  async (k) => {
    if (k === undefined) {
      jwk.value = undefined
      return
    }
    jwk.value = await crypto.subtle.exportKey('jwk', k)
  },
  { immediate: true }
)
</script>
