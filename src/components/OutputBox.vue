<template>
  <div class="share" @click="handleShareClick">
    {{ props.value }}
    <Transition name="copy">
      <span v-if="recentlyCopied !== null" class="copyNotification">
        <v-icon :icon="mdiContentCopy"></v-icon>
      </span>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { mdiContentCopy } from '@mdi/js'

const props = defineProps<{ value: string }>()
const recentlyCopied = ref(null as null | number)

const handleShareClick = (e: MouseEvent) => {
  if (e.target === null) return
  const d = e.target as HTMLDivElement
  window.getSelection()?.selectAllChildren(d)
  navigator.clipboard.writeText(d.innerText)

  if (recentlyCopied.value !== null) {
    clearTimeout(recentlyCopied.value)
    recentlyCopied.value = null
  }
  recentlyCopied.value = setTimeout(() => {
    recentlyCopied.value = null
  }, 1500) as unknown as number
}
</script>

<style scoped>
.copy-enter-active {
  transition: all 0.1s ease-in;
}
.copy-leave-active {
  transition: all 1s ease-out;
}

.copy-enter-from {
  opacity: 0;
  transform: translateX(1em);
}
.copy-leave-to {
  opacity: 0;
}

.copyNotification {
  /* border-radius: 0.3em; */
  position: absolute;
  right: 0;
  background: lightgray;
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
