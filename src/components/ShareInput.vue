<template>
  <div class="shareElement">
    <el-input-number v-model="key_id" :disabled="formattedData" :min="1" size="small" />
    <el-input v-model="data" />
    {{ signatureStatus }}
    {{ verifyResult }}
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
let data_parse_token = Symbol()
const share = ref<ShareFormatter | undefined>(undefined)

const signatureStatus = ref<string | undefined>()
const verifyResult = ref<boolean | undefined>(undefined)
let verifyResultToken = Symbol('Verify result')

watch(share, (s) => {
  if (s === undefined) {
    signatureStatus.value = ''
    return
  }
  if (s.signature_info === undefined) {
    signatureStatus.value = '?'
    return
  }
  const current_token = Symbol('Verify result')
  verifyResultToken = current_token
  verifyResult.value = undefined
  s.verify().then((v) => {
    if (verifyResultToken !== current_token) return
    verifyResult.value = v
  })
  signatureStatus.value = 'Loading'
})

watch(data, (d) => {
  const current_token = Symbol()
  data_parse_token = current_token
  ShareFormatter.fromString(d)
    .then((v) => {
      if (current_token === data_parse_token) share.value = v
    })
    .catch((e) => {
      console.warn(`Could not transform ${d}: ${e}`)
    })
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

watch([key_id, share], ([k, s]) => {
  emits('update:raw', { key_id: k, data: data.value })
  if (s === undefined) {
    emits('shareUpdate', undefined)
    return
  }
  key_id.value = s.share_id ?? k
  if (key_id.value !== undefined) {
    emits('shareUpdate', { data: s.share_data, id: key_id.value })
  }
})
</script>

<style scoped>
.shareElement {
  max-width: 20em;
  display: flex;
}
</style>
