<template>
  <div class="share" @click="handleShareClick">
    {{ props.value }}
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from "element-plus";

const props = defineProps<{ value: string }>();

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
    showClose:true
  });
};
</script>

<style scoped>
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
  white-space: nowrap;
}
</style>
