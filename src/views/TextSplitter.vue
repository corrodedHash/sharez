<template>
  <div class="container">
    <el-slider
      v-model.number="shareCount"
      type="range"
      :step="1"
      :min="1"
      :max="10"
      :show-tooltip="false"
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
      <output-box v-for="(s, index) in shares" :key="index" :value="s ?? 'loading'" />
    </transition-group>
  </div>
</template>
<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { ElSlider, ElInput, ElButton, ElIcon } from 'element-plus'
import { CirclePlusFilled, CircleCheckFilled, CircleCloseFilled } from '@element-plus/icons-vue'
import { SSS } from '@/util/sss'
import OutputBox from '@/components/OutputBox.vue'
import { ShareFormatter, fromRawPrivateKey, generateKeyPair } from '@/util/ShareFormatter'
import { fromBase64String, toBase64String } from '@/util/basic'

const shareCount = ref(2)
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
watch(privateKey, (k) => {
  const my_token = Symbol('Import key')
  privateKeyImportToken = my_token
  let privateKey_raw
  try {
    privateKey_raw = fromBase64String(k)
  } catch {
    signingKeyPair.value = undefined
    return
  }
  fromRawPrivateKey(privateKey_raw)
    .then((v) => {
      if (privateKeyImportToken === my_token) signingKeyPair.value = v
    })
    .catch((e) => {
      if (privateKeyImportToken !== my_token) return
      signingKeyPair.value = undefined
      console.log('Incorrect private key', e)
    })
})

const shares = ref<string[]>([])
let share_calc_token = Symbol()
watch(
  [shareCount, sharedText, signingKeyPair],
  ([shareCount, sharedText, signingKeyPair]) => {
    const encoder = new TextEncoder()
    const secret = encoder.encode(sharedText)
    const share_gen = SSS.from_secret(secret, shareCount)
    const current_token = Symbol()
    share_calc_token = current_token
    shares.value = [...new Array(shareCount)]
    for (let i = 0; i < shareCount; i++) {
      ;(async () => {
        const shareFormatter = new ShareFormatter(i + 1, share_gen.get_share(i + 1))
        if (signingKeyPair !== undefined) {
          await shareFormatter.sign(signingKeyPair)
        }
        const resultShare = await shareFormatter.toString()
        if (current_token === share_calc_token) {
          shares.value[i] = resultShare
        }
      })()
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
