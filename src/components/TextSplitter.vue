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
    <transition-group
      v-if="sharedText.length > 0"
      name="shareList"
      tag="div"
      class="shareBox"
    >
      <output-box v-for="(s, index) in shares" :key="index" :value="s" />
    </transition-group>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from "vue";
import { ElSlider, ElInput } from "element-plus";
import { SSS } from "../util/sss";
import OutputBox from "./OutputBox.vue";
import { ShareFormatter } from "../util/ShareFormatter";

const shareCount = ref(1);
const sharedText = ref("There is no heaven");

const shares = computed(() => {
  const encoder = new TextEncoder();
  const secret = encoder.encode(sharedText.value);
  const share_gen = SSS.from_secret(secret, shareCount.value);

  return [...[...new Array(shareCount.value)].keys()].map((v) =>
    new ShareFormatter(v + 1, share_gen.get_share(v + 1)).toString()
  );
});
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
