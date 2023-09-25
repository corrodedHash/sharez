<template>
  <div class="container">
    <split-parameters @update:model-value="updateSettings" />
    <v-textarea no-resize v-model="sharedText" type="text" />

    <v-switch v-model="showTextbox" />

    <div v-if="shamir_loading">Calculating polynomials...</div>
    <template v-if="!shamir_loading">
      <div v-if="shares_loading">Calculating shares ({{ shares.length }}/{{ shareCount }})...</div>
      <div v-if="extra_shares_loading">
        Calculating extra shares ({{ extraShares.length }}/{{ extraShareCount }})...
      </div>
      <template v-if="showTextbox">
        <v-btn
          :append-icon="mdiDownload"
          size="x-large"
          :disabled="!creation_finished"
          @click="download()"
        >
          Download</v-btn
        >
        <div class="noLinebreaks outputBox">
          {{
            shares
              .concat(extraShares)
              .map(([, text]) => text)
              .join('\n')
          }}
        </div>
      </template>
      <transition-group
        v-if="sharedText.length > 0 && !showTextbox"
        name="el-zoom-in-top"
        tag="div"
        class="shareBox"
      >
        <output-box
          v-for="(s, index) in shares.concat(extraShares)"
          :key="index"
          :value="s[1] ?? 'loading'"
        />
      </transition-group>
    </template>
  </div>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue'
import OutputBox from '@/components/OutputBox.vue'
import { SSS, ShareEncoder, sign } from 'sharez'
import { ObsoleteResolve } from '@/util/lastEval'

import { createGen, shares as sharesWorker } from '@/util/shareGen'
import { mdiDownload } from '@mdi/js'
import { computed } from 'vue'
import SplitParameters from '@/components/SplitParameters.vue'

const showTextbox = ref(false)

const shareCount = ref(2)
const extraShareCount = ref(0)
const sharedText = ref('A secret shared is a secret no more')

const shares = ref([] as [number, string][])
const shares_loading = ref(false)

const extraShares = ref([] as [number, string][])
const extra_shares_loading = ref(false)

const shamir_gen = ref<SSS>(SSS.from_secret(Uint8Array.from([0]), 1))
const shamir_loading = ref(false)

type CryptoKeyPair = { publicKey: CryptoKey; privateKey: CryptoKey }
const signingKeyPair = ref<CryptoKeyPair | undefined>(undefined)

const creation_finished = computed(
  () => !(shamir_loading.value || shares_loading.value || extra_shares_loading.value)
)

const updateSettings = (s: any) => {
  shareCount.value = s.shareCount
  extraShareCount.value = s.extraShareCount
  signingKeyPair.value = s.signingKeyPair
}

const download = () => {
  if (!creation_finished.value) {
    console.warn('Share creation incomplete')
    return
  }
  const shareText = [
    ...shares.value.map(([, v]) => v),
    ...extraShares.value.map(([, v]) => v)
  ].join('\n')
  const file = new File([shareText], `shares-${new Date().toISOString()}.txt`, {
    type: 'text/plain'
  })
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = file.name
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

const lastCreateGen = (function () {
  let abortController = [new AbortController()]
  return async (text: string, count: number) => {
    abortController[0].abort()
    const myAbortController = new AbortController()
    abortController[0] = myAbortController
    const generator = await createGen(text, count, { signal: myAbortController.signal })
    if (myAbortController.signal.aborted) throw new ObsoleteResolve()
    return generator
  }
})()

watch(
  [sharedText, shareCount],
  async ([t, c]) => {
    shamir_loading.value = true
    try {
      shamir_gen.value = await lastCreateGen(t, c)
      shamir_loading.value = false
    } catch (e) {
      if (e instanceof ObsoleteResolve) {
        console.warn('Obsolete resolve')
        return
      }
    }
  },
  { immediate: true }
)
async function createShares(
  startIndex: number,
  shareCount: number,
  shareGen: SSS,
  signingKeyPair: CryptoKeyPair | undefined,
  abortSignal: AbortSignal,
  callback: (share: string, index: number) => void
) {
  const xValues = [...new Array(shareCount)].map((bla, index) => index + startIndex)
  for await (const sh of sharesWorker(shareGen, xValues, { signal: abortSignal })) {
    let signature
    if (signingKeyPair !== undefined) {
      signature = await sign(sh, signingKeyPair)
    }
    const encodedShare = await new ShareEncoder().encode(sh, signature)
    if (abortSignal.aborted) return
    callback(encodedShare, sh.xValue as number)
  }
}

const generateShares = (function () {
  const bla = [new AbortController()]
  return async (s: SSS, signingKeyPair: CryptoKeyPair | undefined) => {
    bla[0].abort()

    const myController = new AbortController()
    bla[0] = myController

    await createShares(
      1,
      s.requiredShares,
      s,
      signingKeyPair,
      myController.signal,
      (share, index) => shares.value.push([index, share])
    )
    if (myController.signal.aborted) throw new ObsoleteResolve('')
  }
})()

const generateExtraShares = (function () {
  const bla = [new AbortController()]
  return async (s: SSS, extraShareCount: number, signingKeyPair: CryptoKeyPair | undefined) => {
    bla[0].abort()
    bla[0] = new AbortController()
    const myController = bla[0]
    await createShares(
      s.requiredShares + 1,
      extraShareCount,
      s,
      signingKeyPair,
      bla[0].signal,
      (share, index) => {
        if (myController.signal.aborted) return
        extraShares.value.push([index, share])
      }
    )
    if (myController.signal.aborted) throw new ObsoleteResolve('')
  }
})()

watch(
  [shamir_gen, signingKeyPair],
  async ([s, signingKeyPair]) => {
    try {
      shares_loading.value = true
      shares.value = []
      await generateShares(s as SSS, signingKeyPair)
      shares.value = shares.value.sort(([a], [b]) => a - b)
      shares_loading.value = false
    } catch (e) {
      if (e instanceof ObsoleteResolve) {
        console.warn('Obsolete resolve')
      } else {
        throw e
      }
    }
  },
  { immediate: true }
)

watch(
  [shamir_gen, extraShareCount, signingKeyPair],
  async ([s, extraShareCount, signingKeyPair]) => {
    try {
      extra_shares_loading.value = true
      extraShares.value = []
      await generateExtraShares(s as SSS, extraShareCount, signingKeyPair)
      extraShares.value = extraShares.value.sort(([a], [b]) => a - b)
      extra_shares_loading.value = false
    } catch (e) {
      if (e instanceof ObsoleteResolve) {
        console.warn('Obsolete resolve')
      } else {
        throw e
      }
    }
  },
  { immediate: true }
)
</script>
<style scoped>
.privateKeyBox {
  display: flex;
  flex-direction: row;
}
.container {
  display: flex;
  flex-direction: column;
  max-width: 20em;
  width: 20em;
}

.shareBox {
  margin-top: 2em;
  max-width: 100%;
  overflow-x: hidden;
}
.noLinebreaks {
  white-space: pre;
  overflow: scroll;
}
.outputBox {
  border: 2px solid black;
  padding: 1em;
  margin-top: 1em;
  font-family: mono;
  max-height: 10em;
}
</style>
