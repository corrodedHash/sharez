<template>
  <v-layout class="rounded rounded-md">
    <v-app-bar>
      <v-switch v-model="onShare"></v-switch>
    </v-app-bar>
    <v-main class="d-flex align-center justify-center">
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

const onShare = ref(true)
</script>
<style scoped></style>
