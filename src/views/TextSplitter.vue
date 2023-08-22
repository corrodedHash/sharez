<template>
  <div class="container">
    <el-slider
      v-model.number="shareCount"
      type="range"
      :step="1"
      :min="1"
      :max="255"
      :show-tooltip="false"
      show-input
      size="small"
    /><el-slider
      v-model.number="extraShareCount"
      type="range"
      :step="1"
      :min="0"
      :max="255 - shareCount"
      :show-tooltip="false"
      show-input
      size="small"
    />
    <el-input v-model="sharedText" type="text" />
    <div class="privateKeyBox">
      <el-input v-model="privateKey" type="text">
        <template #suffix>
          <el-icon v-if="privateKey !== ''">
            <circle-close-filled v-if="signingKeyPair === undefined" />
            <circle-check-filled v-else />
          </el-icon>
        </template>
      </el-input>
      <el-button :icon="CirclePlusFilled" circle @click="createKeyPair" />
    </div>

    <transition-group v-if="sharedText.length > 0" name="shareList" tag="div" class="shareBox">
      <output-box
        v-for="(s, index) in shares.concat(extraShares)"
        :key="index"
        :value="s ?? 'loading'"
      />
    </transition-group>
  </div>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElSlider, ElInput, ElButton, ElIcon } from 'element-plus'
import { CirclePlusFilled, CircleCheckFilled, CircleCloseFilled } from '@element-plus/icons-vue'
import { SSS } from '@/util/sss'
import OutputBox from '@/components/OutputBox.vue'
import { ShareFormatter, fromRawPrivateKey, generateKeyPair } from '@/util/ShareFormatter'
import { fromBase64String, toBase64String } from '@/util/basic'
import { last } from '@/util/lastEval'

const shareCount = ref(2)
const extraShareCount = ref(0)
const sharedText = ref('A secret shared is a secret no more')

async function createKeyPair() {
  const kp = await generateKeyPair()
  privateKey.value = toBase64String(
    new Uint8Array(await crypto.subtle.exportKey('pkcs8', kp.privateKey))
  )
}
type CryptoKeyPair = { publicKey: CryptoKey; privateKey: CryptoKey }
const privateKey = ref('')
const signingKeyPair = ref<CryptoKeyPair | undefined>(undefined)
let privateKeyImportToken = Symbol('Import key')
watch(privateKey, async (k) => {
  const my_token = Symbol('Import key')
  privateKeyImportToken = my_token
  let privateKey_raw
  try {
    privateKey_raw = fromBase64String(k)
  } catch {
    signingKeyPair.value = undefined
    return
  }
  try {
    const v = await fromRawPrivateKey(privateKey_raw)
    if (privateKeyImportToken === my_token) signingKeyPair.value = v
  } catch (e) {
    if (privateKeyImportToken !== my_token) return
    signingKeyPair.value = undefined
    console.log('Incorrect private key', e)
  }
})

const shares = ref([] as string[])
const extraShares = ref([] as string[])

const shamir_gen = computed(() => {
  const encoder = new TextEncoder()
  const secret = encoder.encode(sharedText.value)
  return SSS.from_secret(secret, shareCount.value)
})

async function createShare(
  index: number,
  s: SSS,
  signingKeyPair: CryptoKeyPair | undefined
): Promise<string> {
  const shareFormatter = new ShareFormatter(index, s.get_share(index))
  if (signingKeyPair !== undefined) {
    await shareFormatter.sign(signingKeyPair)
  }
  return await shareFormatter.toString()
}

async function createShares(
  startIndex: number,
  shareCount: number,
  s: SSS,
  signingKeyPair: CryptoKeyPair | undefined
) {
  const result = [...new Array(shareCount)]
  const promiseResults = result.map((_, index) =>
    createShare(index + startIndex, s, signingKeyPair)
  )
  const resolvedResult = await Promise.all(promiseResults)
  return resolvedResult
}

const generateShares = last(
  async (s: SSS, shareCount: number, signingKeyPair: CryptoKeyPair | undefined) => {
    return createShares(1, shareCount, s, signingKeyPair)
  }
)
const generateExtraShares = last(
  async (
    s: SSS,
    shareCount: number,
    extraShareCount: number,
    signingKeyPair: CryptoKeyPair | undefined
  ) => {
    return createShares(shareCount + 1, extraShareCount, s, signingKeyPair)
  }
)

watch(
  [shamir_gen, shareCount, signingKeyPair],
  async ([s, shareCount, signingKeyPair]) => {
    shares.value = await generateShares(s, shareCount, signingKeyPair)
  },
  { immediate: true }
)

watch(
  [shamir_gen, shareCount, extraShareCount, signingKeyPair],
  async ([s, shareCount, extraShareCount, signingKeyPair]) => {
    extraShares.value = await generateExtraShares(s, shareCount, extraShareCount, signingKeyPair)
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

.shareList-enter-active,
.shareList-leave-active {
  transition: all 0.5s ease;
}

.shareList-enter-from {
  opacity: 0;
  transform: rotateX(90deg) translateX(2em);
}

.shareList-leave-to {
  opacity: 0;
  transform: scale(0);
}
</style>
