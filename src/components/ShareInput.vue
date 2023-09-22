<template>
  <div class="shareElement">
    <el-input-number v-model="key_id" :min="1" size="small" />
    <el-input v-model="data" />
    <el-icon
      :color="SignatureIconColorMap[signatureStatus]"
      class="no-inherit"
      style="margin-left: 0.2em"
      size="large"
      v-if="signatureStatus !== undefined"
    >
      <SuccessFilled v-if="signatureStatus === 'Verified'" />
      <CircleCloseFilled v-if="signatureStatus === 'Rejected'" />
      <QuestionFilled v-if="signatureStatus === '?'" />
      <Cpu is-loading v-if="signatureStatus === 'Loading'" />
      <Failed v-if="signatureStatus === 'Corrupt'" />
    </el-icon>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElInput, ElInputNumber, ElIcon } from 'element-plus'
import {
  SuccessFilled,
  QuestionFilled,
  CircleCloseFilled,
  Cpu,
  Failed
} from '@element-plus/icons-vue'
import { ObsoleteResolve, last } from '@/util/lastEval'
import { type DecodedShare, ShareDecoder, ShareEncoder } from 'sharez'
import { verify } from 'sharez'

const props = defineProps<{ raw?: string }>()

const emits = defineEmits<{
  (e: 'shareUpdate', share: DecodedShare | undefined): void
}>()

type SignatureStatus = '?' | 'Loading' | 'Corrupt' | 'Verified' | 'Rejected'
const SignatureIconColorMap: { [K in SignatureStatus]: string } = {
  '?': 'lightgray',
  Corrupt: 'red',
  Loading: '#409EFC',
  Rejected: 'red',
  Verified: 'green'
}

const key_id = ref(undefined as undefined | number)
const data = ref('')
const share = ref<DecodedShare | undefined>()
const signatureStatus = ref<SignatureStatus | undefined>()

data.value = props.raw || ''

const calculateSignatureStatus = last(async function (s: DecodedShare | undefined) {
  if (s?.signature === undefined) {
    return undefined
  }
  if (s?.signature === undefined) {
    return '?'
  }

  try {
    const v = await verify(s.share, s.signature)
    return v ? 'Verified' : 'Rejected'
  } catch {
    return 'Corrupt'
  }
})

watch(share, async (s) => {
  signatureStatus.value = 'Loading'
  try {
    signatureStatus.value = await calculateSignatureStatus(s)
  } catch (e) {
    if (e instanceof ObsoleteResolve) console.info('Obsolete resolve')
    else console.warn(e)
  }
})

watch(share, async (s) => {
  emits('shareUpdate', s)
  if (s === undefined) return
  data.value = await new ShareEncoder().encode(s.share, s.signature)
})
const shareFromString = last(async (d: string) => {
  return await new ShareDecoder().decode(d).catch((e) => {
    console.warn(`Could not transform ${d}: ${e}`)
    return undefined
  })
})

watch(
  data,
  async (d) => {
    try {
      share.value = await shareFromString(d)
    } catch (e) {
      if (e instanceof ObsoleteResolve) console.info('Obsolete promise resolved')
      else console.warn(e)
      return
    }
    key_id.value = share.value?.share.xValue
  },
  { immediate: true }
)

watch(key_id, (k) => {
  if (share.value === undefined) return
  share.value.share.xValue = k
})
</script>

<style scoped>
.shareElement {
  max-width: 20em;
  display: flex;
  align-items: center;
}
</style>
