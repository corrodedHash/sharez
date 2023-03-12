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
      <router-view v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </el-main>
  </el-container>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue";
import { Key, Scissor } from "@element-plus/icons-vue";
import { ElHeader, ElSwitch, ElContainer, ElMain } from "element-plus";
import { useRoute, useRouter } from "vue-router";
const route = useRoute();
const router = useRouter();

const onShare = ref(route.path === "/share" || route.path === "/");

watch(onShare, (v) => {
  if (v) {
    router.push("/share");
  } else {
    router.push("/merge");
  }
});
</script>
<style scoped></style>
