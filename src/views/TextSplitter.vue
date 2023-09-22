<template>
  <div class="container">
    <v-slider
      v-model.number="shareCount"
      type="range"
      :step="1"
      :min="1"
      :max="255"
      thumb-label="always"
      size="small"
    >
      <!-- <template v-slot:append>
        <v-text-field
          v-model.number="shareCount"
          hide-details
          single-line
          density="compact"
          type="number"
          style="width: 70px"
        ></v-text-field>
      </template> -->
    </v-slider>
    <v-slider
      v-model.number="extraShareCount"
      type="range"
      :step="1"
      :min="0"
      :max="255 - shareCount"
      thumb-label="always"
      size="small"
    >
      <!-- <template v-slot:append>
        <v-text-field
          v-model.number="extraShareCount"
          hide-details
          single-line
          density="compact"
          type="number"
          style="width: 70px"
        ></v-text-field>
      </template> -->
    </v-slider>
    <v-textarea no-resize v-model="sharedText" type="text" />
    <v-switch v-model="showTextbox" />
    <div class="privateKeyBox">
      <v-text-field v-model="privateKey" type="text">
        <template #label v-if="privateKey !== ''">
          <v-icon :icon="mdiCloseCircle" v-if="signingKeyPair === undefined" />
          <v-icon :icon="mdiCheckCircle" v-else />
        </template>
      </v-text-field>
      <v-btn :icon="mdiPlusCircle" @click="createKeyPair" />
    </div>
    <div v-if="!shamir_loading && shares_loading">Calculating shares...</div>
    <div v-if="!shamir_loading && !shares_loading && extra_shares_loading">
      Calculating extra shares...
    </div>
    <div v-if="shamir_loading">Calculating polynomials...</div>
    <template v-if="!shamir_loading">
      <div v-if="showTextbox" class="noLinebreaks outputBox">
        {{
          shares
            .concat(extraShares)
            .map(([, text]) => text)
            .join('\n')
        }}
      </div>
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
import { SSS, ShareEncoder, generateKeyPair, fromRawPrivateKey, sign } from 'sharez'
import { fromBase64String, toBase64String } from '@/util/basic'
import { ObsoleteResolve, last } from '@/util/lastEval'

import '@/util/shareGen'
import { createGen, shares as sharesWorker } from '@/util/shareGen'
import { mdiCheckCircle, mdiCloseCircle, mdiPlusCircle } from '@mdi/js'

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

const lastCreateGen = last(async (text: string, count: number) => {
  return await createGen(text, count)
})

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
type CryptoKeyPair = { publicKey: CryptoKey; privateKey: CryptoKey }
const privateKey = ref('')
const signingKeyPair = ref<CryptoKeyPair | undefined>(undefined)

async function createKeyPair() {
  const kp = await generateKeyPair()
  privateKey.value = toBase64String(
    new Uint8Array(await crypto.subtle.exportKey('pkcs8', kp.privateKey))
  )
}

const loadKeyPair = last(async (privateKey: string): Promise<CryptoKeyPair | undefined> => {
  let privateKey_raw
  try {
    privateKey_raw = fromBase64String(privateKey)
  } catch {
    return undefined
  }
  try {
    const v = await fromRawPrivateKey(privateKey_raw)
    return v
  } catch (e) {
    return undefined
  }
})

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
    if (signingKeyPair !== undefined) {
      await sign(sh, signingKeyPair)
    }
    const encodedShare = await new ShareEncoder().encode(sh)
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

watch(privateKey, async (privateKey) => {
  const result = await loadKeyPair(privateKey)
  signingKeyPair.value = result
  if (result === undefined) {
    console.log('Incorrect private key')
  }
})

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
}
</style>
