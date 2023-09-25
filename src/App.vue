<template>
  <v-layout class="rounded rounded-md">
    <v-app-bar class="d-flex justify-center align-center">
      <v-app-bar-title>
        Sharez
        <template v-if="onShare">Splitting</template>
        <template v-if="!onShare">Merging</template>
      </v-app-bar-title>
      <template #append>
        <v-btn v-if="onShare" :icon="mdiScissorsCutting" @click="onShare = !onShare" />
        <v-btn v-if="!onShare" :icon="mdiLayersTriple" @click="onShare = !onShare"></v-btn>
      </template>
    </v-app-bar>
    <v-main>
      <keep-alive>
        <component :is="onShare ? TextSplitter : TextMerger" />
      </keep-alive>
    </v-main>
  </v-layout>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import TextSplitter from './views/TextSplitter.vue'
import TextMerger from './views/TextMerger.vue'
import { mdiLayersTriple, mdiScissorsCutting } from '@mdi/js'

const onShare = ref(true)
</script>
<style scoped></style>
