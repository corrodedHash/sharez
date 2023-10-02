<template>
  <div>
    {{ requirement }}
    <div v-for="(s, i) of shares" :key="i">{{ s.share.xValue }}</div>
  </div>
</template>
<script setup lang="ts">
import type { DecodedShare } from 'sharez'
import { computed } from 'vue'

const props = defineProps<{ shares: Array<DecodedShare> }>()
const requirement = computed(() => {
  const x = props.shares.find((v) => v.share.requirement !== undefined)
  return x?.share.requirement
})
</script>
