<template>
  <div class="shareElement">
    <el-input-number
      v-model="key_id"
      :disabled="formattedData"
      :min="1"
      size="small"
    />
    <el-input v-model="data" />
  </div>
</template>
<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { ShareFormatter } from "../util/ShareFormatter";

const emits = defineEmits<{
  (
    e: "update:modelValue",
    share: undefined | { data: Uint8Array; id: number }
  ): void;
}>();

const key_id = ref(undefined as undefined | number);
const data = ref("");
const formattedData = computed(
  () => ShareFormatter.fromString(data.value).share_id !== undefined
);

watch(data, (v) => {
  const f = ShareFormatter.fromString(v);
  if (f.share_id !== undefined) {
    key_id.value = f.share_id;
  }
  if (key_id.value !== undefined) {
    emits("update:modelValue", { data: f.share_data, id: key_id.value });
  }
});
</script>

<style scoped>
.shareElement {
  max-width: 20em;
  display: flex;
}
</style>
