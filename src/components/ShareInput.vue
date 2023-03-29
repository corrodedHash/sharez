<template>
  <div class="shareElement">
    <el-input-number v-model="key_id" :disabled="formattedData" :min="1" size="small" />
    <el-input v-model="data" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { ShareFormatter } from '../util/ShareFormatter'
import { ElInput, ElInputNumber } from 'element-plus'
import type { ShareInfo, ShareInfoRaw } from './ShareInfo'
const props = defineProps<{
  raw?: undefined | ShareInfoRaw
}>()

const emits = defineEmits<{
  (e: 'shareUpdate', share: undefined | ShareInfo): void
  (e: 'update:raw', value: ShareInfoRaw): void
}>()

const key_id = ref(undefined as undefined | number)
const data = ref('')

const share = computed(() => {
  try {
    return ShareFormatter.fromString(data.value)
  } catch {
    return undefined
  }
})

const formattedData = computed(() => {
  return share.value?.share_id !== undefined
})

watch(
  () => props.raw,
  (v) => {
    if (v === undefined) return
    key_id.value = v.key_id
    data.value = v.data
  },
  { immediate: true }
)



watch(data, () => {
  emits('update:raw', { key_id: key_id.value, data: data.value })
  const f = share.value
  if (f === undefined) {
    emits('shareUpdate', undefined)
    return
  }
  if (f.share_id !== undefined) {
    key_id.value = f.share_id
  }
  if (key_id.value !== undefined) {
    emits('shareUpdate', { data: f.share_data, id: key_id.value })
  }
})

watch(key_id, () => {
  emits('update:raw', { key_id: key_id.value, data: data.value })
  const f = share.value
  if (f === undefined) {
    emits('shareUpdate', undefined)
    return
  }
  if (f.share_id !== undefined) {
    key_id.value = f.share_id
  }
  if (key_id.value !== undefined) {
    emits('shareUpdate', { data: f.share_data, id: key_id.value })
  }
})
</script>

<style scoped>
.shareElement {
  max-width: 20em;
  display: flex;
}
</style>
