<template>
  <el-container>
    <el-header>
      <el-switch
        v-model="onShare"
        :active-icon="Scissor"
        :inactive-icon="Key"
        inline-prompt
      ></el-switch>
    </el-header>
    <el-main>
      <keep-alive>
        <component :is="onShare ? TextSplitter : TextMerger" />
      </keep-alive>
    </el-main>
  </el-container>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { Key, Scissor } from '@element-plus/icons-vue'
import { ElHeader, ElSwitch, ElContainer, ElMain } from 'element-plus'
import TextSplitter from './views/TextSplitter.vue'
import TextMerger from './views/TextMerger.vue'

const onShare = ref(true)
</script>
<style scoped></style>
