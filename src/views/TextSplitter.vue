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
    <el-switch v-model="showTextbox" />
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
    <div v-if="showTextbox" class="noLinebreaks outputBox">
      {{ shares.concat(extraShares).join('\n') }}
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
        :value="s ?? 'loading'"
      />
    </transition-group>
  </div>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElSlider, ElInput, ElButton, ElIcon, ElSwitch } from 'element-plus'
import { CirclePlusFilled, CircleCheckFilled, CircleCloseFilled } from '@element-plus/icons-vue'
import { SSS } from '@/util/sss'
import OutputBox from '@/components/OutputBox.vue'
import { ShareFormatter, fromRawPrivateKey, generateKeyPair } from '@/util/ShareFormatter'
import { fromBase64String, toBase64String } from '@/util/basic'
import { last } from '@/util/lastEval'

const showTextbox = ref(false)

const shareCount = ref(2)
const extraShareCount = ref(0)
const sharedText = ref('A secret shared is a secret no more')

const shares = ref([] as string[])
const extraShares = ref([] as string[])

const shamir_gen = computed(() => {
  const encoder = new TextEncoder()
  const secret = encoder.encode(sharedText.value)
  return SSS.from_secret(secret, shareCount.value)
})
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
watch(privateKey, async (privateKey) => {
  const result = await loadKeyPair(privateKey)
  signingKeyPair.value = result
  if (result === undefined) {
    console.log('Incorrect private key')
  }
})

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
