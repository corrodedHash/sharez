<template>
  <div class="mergeBox">
    <MergeProgress
      :decrypted="typeof decrypted === 'string' ? decrypted : null"
      :progress-ratio="[Math.min(shareCount, filtered_shares.length), shareCount]"
    />
    <div v-if="decryption_errored !== undefined">{{ decryption_errored }}</div>
    <div v-if="isDecrypting">Decrypting...</div>
    <div v-if="pubkey !== undefined">
      Public key:
      <key-display :ckey="pubkey" />
    </div>
    <div style="width: 100%">
      <v-text-field label="Shares" type="number" v-model="shareCount" :min="1" :max="255" />
    </div>
    <v-textarea
      v-model="candidate_text"
      no-resize
      style="white-space: nowrap"
      :autofocus="true"
      type="textarea"
      placeholder="shrz:..."
      resize="none"
    />
    <v-btn circle :icon="mdiPlus" @click="insertTextCandidates" />
    <v-file-input
      v-if="!files_loading"
      v-model="candidate_files"
      accept="text/plain"
      multiple
    ></v-file-input>
    <v-progress-circular indeterminate v-if="files_loading"></v-progress-circular>
    <TransitionGroup name="list" tag="div" style="width: 100%">
      <div
        style="width: 100%"
        v-for="{ index } in sorted_shares"
        :key="inputID[index]"
        class="shareInputBox"
      >
        <v-btn circle :icon="mdiMinus" size="small" @click="dropCandidate(index)" />
        <share-input :raw="sharesRaw[index]" @share-update="updateShare(index, $event)" />
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { mdiPlus, mdiMinus } from '@mdi/js'
import { computed, ref, watch } from 'vue'
import { type DecodedShare } from 'sharez'
import ShareInput from '@/components/ShareInput.vue'
import MergeProgress from '@/components/MergeProgress.vue'
import KeyDisplay from '@/components/KeyDisplay.vue'
import { getSecret as getSecretGenerator } from '@/util/shareGen'
import { ObsoleteResolve, last } from '@/util/lastEval'
import type { VTextarea } from 'vuetify/components'
const inputID = [] as number[]
let lastInputID = 0
const shares = ref<(DecodedShare | undefined)[]>([])
const sharesRaw = ref<string[]>([])

const shareCount = ref(2)
const pubkey = ref(undefined as CryptoKey | undefined)

const candidate_files = ref([] as File[])
const files_loading = ref(false)
const candidate_text = ref('')
const candidates = computed(() => getLines(candidate_text.value))

watch(candidate_files, async (f) => {
  if (candidate_files.value.length === 0) return
  files_loading.value = true
  setTimeout(async () => {
    const file_readings = f.map(async (v) => {
      const t = await v.text()
      getLines(t).forEach((v) => addCandidate(v))
    })
    await Promise.all(file_readings)

    candidate_files.value = []
    files_loading.value = false
  }, 20)
})

function getLines(text: string): string[] {
  return text
    .split('\n')
    .map((v) => v.replace(/\s/g, ''))
    .filter((v) => v !== '')
}

function addCandidate(c: string) {
  lastInputID += 1
  inputID.push(lastInputID)
  sharesRaw.value.push(c)
  shares.value.push(undefined)
}

function insertTextCandidates() {
  if (candidates.value.length === 0) {
    addCandidate('')
  } else {
    candidates.value.forEach((v) => addCandidate(v))
  }
  candidate_text.value = ''
}

function dropCandidate(index: number) {
  inputID.splice(index, 1)
  sharesRaw.value.splice(index, 1)
  shares.value.splice(index, 1)
}

function updateShare(index: number, share: DecodedShare | undefined) {
  shares.value.splice(index, 1, share)
}

const decryption_errored = computed(() =>
  decrypted.value instanceof Error ? decrypted.value.message : undefined
)

const relevant_share_data = computed(() =>
  shares.value.map((v): [number, Uint8Array] | undefined =>
    v?.share.xValue === undefined ? undefined : [v.share.xValue, v.share.yValues]
  )
)

const filtered_shares = computed(() =>
  relevant_share_data.value.filter((v): v is Exclude<typeof v, undefined> => v !== undefined)
)

const decrypted = ref(undefined as string | Error | undefined)
const isDecrypting = ref(false)

const decryptSecret = (function () {
  const token = [new AbortController()]
  return async (shares: [number, Uint8Array][], count: number) => {
    token[0].abort()
    token[0] = new AbortController()

    if (shares.length < count) {
      decrypted.value = new Error(`Too few shares ${shares.length}/ ${count}`)
      return
    }
    const joinedShares = shares.map(
      ([share_id, share_data]) => [share_data, share_id] as [Uint8Array, number]
    )
    const x_values = shares.map(([share_id]) => share_id)
    const y_values = shares.map(([, share_data]) => share_data)

    const a = new Set(x_values)
    if (a.size !== x_values.length) {
      decrypted.value = new Error('Contains equal share IDs')
      return
    }

    const result_length = y_values[0].length
    const wrong_size = y_values.findIndex((v) => v.length !== result_length)
    if (wrong_size !== -1) {
      decrypted.value = new Error(`Share ID ${x_values[wrong_size]} has wrong length`)
      return
    }

    const combined_sss = await getSecretGenerator(joinedShares.slice(0, count))
    if (token[0].signal.aborted) throw new ObsoleteResolve()

    const decoder = new TextDecoder()
    decrypted.value = decoder.decode(Uint8Array.from(combined_sss.secret))
    return
  }
})()

const decryptDebounce = last(
  (ms: number) =>
    new Promise((resolve) => {
      setTimeout(() => {
        resolve('')
      }, ms)
    })
)

watch(
  [filtered_shares, shareCount],
  async ([filteredShares, sc]) => {
    try {
      await decryptDebounce(100)
    } catch (ex) {
      if (ex instanceof ObsoleteResolve) {
        console.warn('Debounced')
        return
      } else {
        throw ex
      }
    }
    try {
      decrypted.value = undefined
      isDecrypting.value = true
      await decryptSecret(filteredShares, sc)
      isDecrypting.value = false
    } catch (ex) {
      if (ex instanceof ObsoleteResolve) {
        console.warn('Obsolete resolve')
        return
      } else {
        throw ex
      }
    }
  },
  { immediate: true }
)

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
    const pubkeys = sortedCounts(s.map((v) => v?.signature?.pubkey)).filter(
      (v): v is [CryptoKey, number] => v[0] !== undefined
    )
    const req_counts = sortedCounts(s.map((v) => v?.share.requirement)).filter(
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
      a.element?.share.xValue === undefined
        ? 1
        : b.element?.share.xValue === undefined
        ? -1
        : a.element.share.xValue - b.element.share.xValue
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
