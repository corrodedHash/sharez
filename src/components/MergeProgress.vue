<template>
  <div class="resultBox">
    <Transition name="resultBox">
      <v-progress-circular
        v-if="!isDecrypted"
        class="progressCircle"
        :model-value="progressPercentage"
        :size="70"
        :width="10"
      >
        {{ progressPercentage }}%
      </v-progress-circular>
      <span v-else class="resultText">
        {{ decrypted }}
      </span>
    </Transition>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{
  decrypted: string | null
  progressRatio: [number, number]
}>()

const isDecrypted = computed(() => typeof props.decrypted === 'string')

const progressPercentage = computed(() =>
  Math.min(Math.round((props.progressRatio[0] / props.progressRatio[1]) * 100), 100)
)
</script>

<style scoped>
.resultBox {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  height: 10em;
}

.resultBox-leave-active.progressCircle,
.resultBox-enter-active.resultText {
  transition: transform 0.5s ease-in;
}

.resultBox-leave-active {
  position: absolute;
}

.resultBox-leave-active.resultText,
.resultBox-enter-active.progressCircle {
  transition: transform 0.2s ease-out;
}

.progressCircle,
.resultText {
  transform-style: preserve-3d;
  transform-origin: center center 50px;
}
.resultBox-enter-from.progressCircle,
.resultBox-leave-to.progressCircle {
  transform: rotateY(90deg);
}
.resultBox-enter-from.resultText,
.resultBox-leave-to.resultText {
  transform: rotateY(-90deg);
}
</style>
