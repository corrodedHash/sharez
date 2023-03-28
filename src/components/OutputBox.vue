<template>
  <div class="share" @click="handleShareClick">
    {{ props.value }}
    <Transition name="copy">
      <span v-if="recentlyCopied" class="copyNotification">
        <el-icon><CopyDocument /></el-icon>
      </span>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ElIcon } from "element-plus";
import { CopyDocument } from "@element-plus/icons-vue";
import { ref } from "vue";

const props = defineProps<{ value: string }>();
const recentlyCopied = ref(null as null | number);

const handleShareClick = (e: MouseEvent) => {
  if (e.target === null) return;
  const d = e.target as HTMLDivElement;
  window.getSelection()?.selectAllChildren(d);
  navigator.clipboard.writeText(d.innerText);

  if (recentlyCopied.value !== null) {
    clearTimeout(recentlyCopied.value);
    recentlyCopied.value = null;
  }
  recentlyCopied.value = setTimeout(() => {
    recentlyCopied.value = null;
  }, 1500) as unknown as number;
};
</script>

<style scoped>
copy-enter-active,
.copy-leave-active {
  transition: opacity 0.5s ease;
}

.copy-enter-from,
.copy-leave-to {
  opacity: 0;
}

.copyNotification {
  position: absolute;
  right: 0;
  background: white;
  padding-left: 1em;
  padding-right: 0.5em;
  margin-right: 0.2em;
  border: 1px solid black;
}
.share {
  position: relative;
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
