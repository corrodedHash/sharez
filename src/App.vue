<template>
  <el-container>
    <el-header>
      <el-button :icon="Setting" size="large" @click="dialogVisible = true" />
    </el-header>
    <el-main>
      <div class="container"><TextSplitter /><TextMerger /></div>

      <el-dialog v-model="dialogVisible" title="Tips" width="30%">
        <el-select
          v-model="configStore.outputFormat"
          class="m-2"
          placeholder="Select"
          size="large"
        >
          <el-option
            v-for="item in outputFormats"
            :key="item"
            :label="item.charAt(0).toUpperCase() + item.slice(1)"
            :value="item"
          />
        </el-select>
      </el-dialog>
    </el-main>
  </el-container>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { outputFormats, useOutputConfigStore } from "./store";
import { Setting } from "@element-plus/icons-vue";
import {
  ElHeader,
  ElSelect,
  ElButton,
  ElDialog,
  ElOption,
  ElContainer,
  ElMain,
} from "element-plus";
import TextSplitter from "./components/TextSplitter.vue";
import TextMerger from "./components/TextMerger.vue";
const dialogVisible = ref(false);
const configStore = useOutputConfigStore();
</script>
<style scoped>
.container {
  margin: auto;
}
</style>
