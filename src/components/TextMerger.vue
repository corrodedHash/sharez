<template>
  <div class="mergeBox">
    <MergeProgress
      :decrypted="typeof decrypted === 'string' ? decrypted : undefined"
      :progress-ratio="[
        Math.min(shareCount, filtered_shares.length),
        shareCount,
      ]"
    />
    <div>
      Shares: <el-input-number v-model="shareCount" type="number" :min="1" />
    </div>
    <TransitionGroup name="list" tag="div">
      <share-input
        v-for="{ index } in sorted_test"
        :key="index"
        @update:model-value="updateShare(index, $event)"
      />
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { ElInputNumber } from "element-plus";
import { computed, ref, watch } from "vue";
import { SSS } from "../util/sss";
import ShareInput from "./ShareInput.vue";
import MergeProgress from "./MergeProgress.vue";

const shares = ref([] as ({ key_id: number; key: Uint8Array } | undefined)[]);
const updateShare = (
  index: number,
  share: { data: Uint8Array; id: number } | undefined
) => {
  shares.value[index] =
    share === undefined ? undefined : { key_id: share.id, key: share.data };
};

const shares_has_empty_field = computed(
  () => shares.value.find((v) => v === undefined) !== undefined
);

const filtered_shares = computed(
  () =>
    shares.value.filter((v) => v !== undefined) as {
      key_id: number;
      key: Uint8Array;
    }[]
);

const decrypted = computed(() => {
  if (filtered_shares.value.length !== shareCount.value) {
    return undefined;
  }
  const x_values = filtered_shares.value.map(({ key_id }) => key_id);
  const a = new Set(x_values);
  if (a.size !== x_values.length) {
    return new Error("Contains equal share IDs");
  }
  const y_values = filtered_shares.value.map(({ key }) => key);
  const result_length = y_values[0].length;
  const wrong_size = y_values.findIndex((v) => v.length !== result_length);
  if (wrong_size !== -1) {
    return new Error(`Share ID ${x_values[wrong_size]} has wrong length`);
  }
  const combined_sss = SSS.from_shares(y_values, x_values);

  const decoder = new TextDecoder();
  return decoder.decode(Uint8Array.from(combined_sss.get_secret()));
});

const shareCount = ref(2);

const maybe_append_empty = () => {
  if (!shares_has_empty_field.value && shareCount.value > shares.value.length) {
    shares.value.push(undefined);
  }
};

watch(shareCount, () => {
  maybe_append_empty();
});
watch(
  shares,
  () => {
    maybe_append_empty();
  },
  { immediate: true, deep: true }
);

const sorted_test = computed(() => {
  return shares.value
    .map((v, i) => ({ index: i, element: v }))
    .sort((a, b) =>
      a.element === undefined
        ? 1
        : b.element === undefined
        ? -1
        : a.element.key_id - b.element.key_id
    );
});
</script>

<style scoped>
.list-move {
  transition: all 0.5s ease;
}
.mergeBox {
  display: flex;
  flex-direction: column;
  justify-content: center;
  justify-items: center;
  align-items: center;
}
</style>
