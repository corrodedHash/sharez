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
    <div v-if="sharedText.length > 0" class="shareBox">
      <div
        v-for="(s, index) in shares"
        :key="index"
        class="share"
        @click="handleShareClick"
      >
        {{ s }}
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from "vue";
import { str2hex, share } from "secrets.js-grempe";
import { ElMessage } from "element-plus";
import { useOutputConfigStore } from "../store";
const shareCount = ref(1);
const sharedText = ref("There is no heaven");

const shares = computed(() => {
  return share(str2hex(sharedText.value), shareCount.value, shareCount.value);
});

const outputFormatStore = useOutputConfigStore();

const handleShareClick = (e: MouseEvent) => {
  if (e.target === null) return;
  const d = e.target as HTMLDivElement;
  window.getSelection()?.selectAllChildren(d);
  navigator.clipboard.writeText(d.innerText);

  ElMessage({
    message: "Copied",
    type: "info",
    grouping: true,
    duration: 1500,
  });
};
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
}

.share {
  font-family: monospace;
  font-size: larger;
  overflow-x: scroll;
  scrollbar-width: none;
  padding: 0.2em;
  text-align: center;
  padding-right: 1em;
  border: 2px solid red;
  border-radius: 0.2em;
  margin-top: 0.2em;
}
</style>
