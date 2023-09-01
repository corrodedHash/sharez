<template>
  <div class="mergeBox">
    <MergeProgress
      :decrypted="typeof decrypted === 'string' ? decrypted : null"
      :progress-ratio="[Math.min(shareCount, filtered_shares.length), shareCount]"
    />
    <div v-if="decryption_errored !== undefined">{{ decryption_errored }}</div>
    <div v-if="pubkey !== undefined">
      Public key:
      <key-display :ckey="pubkey" />
    </div>
    <div>
      Shares:
      <el-input-number v-model="shareCount" type="number" :min="1" :max="256" />
    </div>
    <div>
      <el-input v-model="candidate_text" type="textarea" placeholder="shrz:..." />
      <el-button circle :icon="Plus" @click="addCandidate" />
    </div>
    <TransitionGroup name="list" tag="div">
      <div
        v-for="{ index, element } in sorted_shares"
        :key="element?.share_id ? 's-' + element.share_id : index"
        class="shareInputBox"
      >
        <el-button circle :icon="Minus" size="small" @click="dropCandidate(index)" />
        <share-input :raw="sharesRaw[index]" @share-update="updateShare(index, $event)" />
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { ElInputNumber, ElButton, ElInput } from 'element-plus'
import { computed, ref, watch } from 'vue'
import { SSS } from '@/util/sss'
import ShareInput from '@/components/ShareInput.vue'
import MergeProgress from '@/components/MergeProgress.vue'
import type { ShareFormatter } from '@/util/ShareFormatter'
import KeyDisplay from '@/components/KeyDisplay.vue'
import { Plus, Minus } from '@element-plus/icons-vue'

const shares = ref<(ShareFormatter | undefined)[]>([])
const sharesRaw = ref<string[]>([])

const shareCount = ref(2)
const pubkey = ref(undefined as CryptoKey | undefined)

const candidate_text = ref('')
const candidates = computed(() =>
  candidate_text.value
    .split('\n')
    .map((v) => v.replace(/\s/g, ''))
    .filter((v) => v !== '')
)

function addCandidate() {
  if (candidates.value.length === 0) {
    sharesRaw.value.push('')
    shares.value.push(undefined)
  } else {
    for (const x of candidates.value) {
      sharesRaw.value.push(x)
      shares.value.push(undefined)
    }
  }
  candidate_text.value = ''
}

function dropCandidate(index: number) {
  console.log('removing', index, sharesRaw.value)
  sharesRaw.value.splice(index, 1)
  shares.value.splice(index, 1)
}

function updateShare(index: number, share: ShareFormatter | undefined) {
  shares.value.splice(index, 1, share)
}

const decryption_errored = computed(() =>
  decrypted.value instanceof Error ? decrypted.value.message : undefined
)

const relevant_share_data = computed(() =>
  shares.value.map((v): [number, Uint8Array] | undefined =>
    v?.share_id === undefined ? undefined : [v.share_id, v.share_data]
  )
)

const filtered_shares = computed(() =>
  relevant_share_data.value.filter((v): v is Exclude<typeof v, undefined> => v !== undefined)
)

const decrypted = computed(() => {
  if (filtered_shares.value.length !== shareCount.value) {
    return undefined
  }
  const x_values = filtered_shares.value.map(([share_id]) => share_id)
  const y_values = filtered_shares.value.map(([, share_data]) => share_data)

  const a = new Set(x_values)
  if (a.size !== x_values.length) {
    return new Error('Contains equal share IDs')
  }

  const result_length = y_values[0].length
  const wrong_size = y_values.findIndex((v) => v.length !== result_length)
  if (wrong_size !== -1) {
    return new Error(`Share ID ${x_values[wrong_size]} has wrong length`)
  }
  const combined_sss = SSS.from_shares(y_values, x_values)

  const decoder = new TextDecoder()
  return decoder.decode(Uint8Array.from(combined_sss.get_secret()))
}, {})

/**
 Deduplicate array and count occurences of equal elements  
 Returns values sorted highest to lowest
 */
function sortedCounts<T>(countedArray: T[]): [T, number][] {
  const result = countedArray.reduce(
    (acc, v) => {
      const index = acc.findIndex(([x]) => x === v)
      if (index === -1) acc.push([v, 1])
      else acc[index][1] += 1
      return acc
    },
    [] as [T, number][]
  )
  return result.sort((a, b) => b[1] - a[1])
}

watch(
  shares,
  (s) => {
    const pubkeys = sortedCounts(s.map((v) => v?.pubkey)).filter(
      (v): v is [CryptoKey, number] => v[0] !== undefined
    )
    const req_counts = sortedCounts(s.map((v) => v?.share_requirement)).filter(
      (v): v is [number, number] => v[0] !== undefined
    )
    if (req_counts.length === 1) {
      shareCount.value = req_counts[0][0]
    }
    if (pubkeys.length === 1) {
      pubkey.value = pubkeys[0][0]
    } else {
      pubkey.value = undefined
    }
  },
  { deep: true }
)

const sorted_shares = computed(() => {
  return shares.value
    .map((v, i) => ({ index: i, element: v }))
    .sort((a, b) =>
      a.element?.share_id === undefined
        ? 1
        : b.element?.share_id === undefined
        ? -1
        : a.element.share_id - b.element.share_id
    )
})
</script>

<style scoped>
.list-move {
  transition: all 0.5s ease;
}
.shareInputBox {
  display: flex;
  flex-direction: row;
}
.mergeBox {
  display: flex;
  flex-direction: column;
  justify-content: center;
  justify-items: center;
  align-items: center;
}
</style>
