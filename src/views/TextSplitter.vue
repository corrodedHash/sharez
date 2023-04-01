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
    <transition-group v-if="sharedText.length > 0" name="shareList" tag="div" class="shareBox">
      <output-box v-for="(s, index) in shares" :key="index" :value="s ?? 'loading'" />
    </transition-group>
  </div>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElSlider, ElInput } from 'element-plus'
import { SSS } from '../util/sss'
import OutputBox from '@/components/OutputBox.vue'
import { ShareFormatter } from '../util/ShareFormatter'

const shareCount = ref(2)
const sharedText = ref('一夫当关 万夫莫开')

const shares = ref<string[]>([])
let share_calc_token = Symbol()
watch(
  [shareCount, sharedText],
  ([c, t]) => {
    const encoder = new TextEncoder()
    const secret = encoder.encode(t)
    const share_gen = SSS.from_secret(secret, c)
    const current_token = Symbol()
    share_calc_token = current_token
    shares.value = [...new Array(c)]
    for (let i = 0; i < c; i++) {
      new ShareFormatter(i + 1, share_gen.get_share(i + 1)).toString().then((s) => {
        if (current_token === share_calc_token) shares.value[i] = s
      })
    }
  },
  { immediate: true }
)
</script>
<style scoped>
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
