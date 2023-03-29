<template>
  <div class="mergeBox">
    <MergeProgress
      :decrypted="typeof decrypted === 'string' ? decrypted : null"
      :progress-ratio="[Math.min(shareCount, filtered_shares.length), shareCount]"
    />
    <div v-if="decryption_errored !== undefined">{{ decryption_errored }}</div>
    <div>Shares: <el-input-number v-model="shareCount" type="number" :min="1" /></div>
    <TransitionGroup name="list" tag="div">
      <share-input
        v-for="{ index } in sorted_test"
        :key="index"
        v-model="shares_raw[index]"
        @share-update="shares[index] = $event"
      />
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { ElInputNumber } from 'element-plus'
import { computed, ref, watch } from 'vue'
import { SSS } from '@/util/sss'
import ShareInput from '@/components/ShareInput.vue'
import MergeProgress from '@/components/MergeProgress.vue'
import type { ShareInfo, ShareInfoRaw } from '@/components/ShareInfo'

const shares_raw = ref<(ShareInfoRaw | undefined)[]>([])
const shares = ref<(ShareInfo | undefined)[]>([])

const shares_has_empty_field = computed(
  () => shares.value.find((v) => v === undefined) !== undefined
)

const decryption_errored = computed(() =>
  decrypted.value instanceof Error ? decrypted.value.message : undefined
)

const filtered_shares = computed(() =>
  shares.value.filter((v): v is Exclude<typeof v, undefined> => v !== undefined)
)

const decrypted = computed(() => {
  if (filtered_shares.value.length !== shareCount.value) {
    return undefined
  }
  const x_values = filtered_shares.value.map(({ id }) => id)
  const a = new Set(x_values)
  if (a.size !== x_values.length) {
    return new Error('Contains equal share IDs')
  }
  const y_values = filtered_shares.value.map(({ data }) => data)
  const result_length = y_values[0].length
  const wrong_size = y_values.findIndex((v) => v.length !== result_length)
  if (wrong_size !== -1) {
    return new Error(`Share ID ${x_values[wrong_size]} has wrong length`)
  }
  const combined_sss = SSS.from_shares(y_values, x_values)

  const decoder = new TextDecoder()
  return decoder.decode(Uint8Array.from(combined_sss.get_secret()))
}, {})

const shareCount = ref(2)

const change_share_count = () => {
  if (shareCount.value < shares.value.length) {
    while (shareCount.value < shares.value.length) {
      const undefined_index = shares.value.findIndex((v) => v === undefined || v === null)
      if (undefined_index === -1) break
      shares.value.splice(undefined_index, 1)
      shares_raw.value.splice(undefined_index, 1)
    }
  } else if (!shares_has_empty_field.value && shareCount.value > shares.value.length) {
    shares.value.push(undefined)
    shares_raw.value.push(undefined)
  }
}

watch(shareCount, () => {
  change_share_count()
})
watch(
  shares,
  () => {
    change_share_count()
  },
  { immediate: true, deep: true }
)

const sorted_test = computed(() => {
  return shares.value
    .map((v, i) => ({ index: i, element: v }))
    .sort((a, b) =>
      a.element === undefined ? 1 : b.element === undefined ? -1 : a.element.id - b.element.id
    )
})
</script>

<style scoped>
.list-move {
  transition: all 0.5s ease;
}
.mergeBox {
  display: flex;
  flex-direction: column;
  justify-content: center;
  justify-items: center;
  align-items: center;
}
</style>
