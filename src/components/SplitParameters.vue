<template>
  <v-sheet :elevation="1" class="px-4 pt-2">
    <v-slider
      v-model.number="settings.shareCount"
      type="range"
      :step="1"
      :min="1"
      :max="255"
      size="small"
    >
      <template #append>
        <v-text-field
          v-model.number="settings.shareCount"
          hide-details
          single-line
          density="compact"
          type="number"
          style="width: 70px"
        ></v-text-field>
      </template>
    </v-slider>
    <v-slider
      v-model.number="settings.extraShareCount"
      type="range"
      :step="1"
      :min="0"
      :max="255 - settings.shareCount"
      size="small"
    >
      <template #append>
        <v-text-field
          v-model.number="settings.extraShareCount"
          hide-details
          single-line
          density="compact"
          size="small"
          type="number"
          style="width: 70px"
        ></v-text-field>
      </template>
    </v-slider>
    <div class="privateKeyBox">
      <v-text-field label="Signature key" v-model="privateKey" type="text">
        <template #prepend-inner v-if="privateKey !== ''">
          <v-icon :icon="mdiCloseCircle" v-if="settings.signingKeyPair === undefined" />
          <v-icon :icon="mdiCheckCircle" v-else />
        </template>
        <template #append>
          <v-btn
            :icon="privateKey === '' ? mdiPlusCircle : mdiDiceMultiple"
            @click="createKeyPair"
          />
        </template>
      </v-text-field>
    </div>
  </v-sheet>
</template>
<script setup lang="ts">
import { fromBase64String, toBase64String } from '@/util/basic'
import { last } from '@/util/lastEval'
import { mdiCheckCircle, mdiCloseCircle, mdiPlusCircle, mdiDiceMultiple } from '@mdi/js'
import { fromRawPrivateKey, generateKeyPair } from 'sharez'
import { reactive, ref, unref, watch } from 'vue'

const emits = defineEmits<{
  (e: 'update:model-value', v: typeof settings): void
}>()

const settings = reactive({
  shareCount: 2,
  extraShareCount: 0,
  signingKeyPair: undefined as undefined | CryptoKeyPair
})

watch(settings, (s) => {
  emits('update:model-value', unref(s))
})

type CryptoKeyPair = { publicKey: CryptoKey; privateKey: CryptoKey }
const privateKey = ref('')

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
watch(privateKey, async (privateKey) => {
  const result = await loadKeyPair(privateKey)
  settings.signingKeyPair = result
  if (result === undefined) {
    console.log('Incorrect private key')
  }
})
</script>
