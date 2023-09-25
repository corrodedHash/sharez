<template>
  <v-layout class="rounded rounded-md">
    <v-app-bar class="d-flex justify-center align-center">
      <v-app-bar-title>
        Sharez
        {{ modeTable[shamirModeIndex].name }}
      </v-app-bar-title>
      <template #append>
        <v-btn-toggle v-model="shamirModeIndex" mandatory variant="outlined" divided>
          <v-btn :icon="mdiScissorsCutting" />
          <v-btn :icon="mdiLayersTriple" />
        </v-btn-toggle>
      </template>
    </v-app-bar>
    <v-main>
      <keep-alive>
        <component :is="modeTable[shamirModeIndex].component" />
      </keep-alive>
    </v-main>
  </v-layout>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import TextSplitter from './views/TextSplitter.vue'
import TextMerger from './views/TextMerger.vue'
import { mdiLayersTriple, mdiScissorsCutting } from '@mdi/js'
const shamirModeIndex = ref(0)
const modeTable = [
  { component: TextSplitter, name: 'Splitting' },
  { component: TextMerger, name: 'Merging' }
]
</script>
<style scoped></style>
