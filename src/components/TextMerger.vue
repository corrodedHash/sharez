<template>
  <div>
    <div class="shareInput">
      <el-input />
    </div>
    <span
      >Shares: <el-input-number v-model="shareCount" type="number" :min="1" />
    </span>
    <TransitionGroup name="list" tag="div">
      <div
        v-for="{ index, element } in sorted_test"
        :key="index"
        class="shareElement"
      >
        <el-input-number v-model="element.key_id" :min="0" size="small" />
        <el-input v-model="element.key" />
      </div>
    </TransitionGroup>

    <el-progress
      type="circle"
      :status="undefined"
      :percentage="
        Math.min(Math.round((parsed_shares.length / shareCount) * 100), 100)
      "
    />
    {{ decrypted }}
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { combine, hex2str, init as sss_init } from "secrets.js-grempe";
sss_init(8, "browserCryptoGetRandomValues");
const shares = ref([] as { key_id: number | undefined; key: string }[]);
const shares_has_empty_field = computed(
  () =>
    shares.value.find(({ key }) => {
      return key.length === 0;
    }) !== undefined
);

const parsed_shares = computed(() => {
  return shares.value
    .filter(({ key_id, key }) => {
      return key_id !== undefined && key.length > 0;
    })
    .map(({ key_id, key }) => {
      return { key_id: key_id as number, key: fromHexString(key) };
    });
});

const decrypted = computed(() => {
  if (parsed_shares.value.length !== shareCount.value) {
    return undefined;
  }
  const result = [];
  const x_values = parsed_shares.value.map(({ key_id }) => key_id);
  const a = new Set(x_values);
  if (a.size !== x_values.length) {
    return new Error("Contains equal share IDs");
  }
  const y_values = parsed_shares.value.map(({ key }) => key);
  const result_length = y_values[0].length;
  const wrong_size = y_values.findIndex((v) => v.length !== result_length);
  if (wrong_size !== -1) {
    return new Error(`Share ID ${x_values[wrong_size]} has wrong length`);
  }
  for (let i = 0; i < parsed_shares.value[0].key.length; i++) {
    const p = get_polynomial(
      x_values,
      y_values.map((v) => v[i])
    );
    result.push(evaluate_polynomial(p, 0, MODULUS));
  }
  const decoder = new TextDecoder();
  return decoder.decode(Uint8Array.from(result));
});

const shareCount = ref(2);

const maybe_append_empty = () => {
  if (!shares_has_empty_field.value && shareCount.value > shares.value.length) {
    shares.value.push({ key_id: undefined, key: "" });
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
      a.element.key_id === undefined
        ? 1
        : b.element.key_id === undefined
        ? -1
        : a.element.key_id - b.element.key_id
    );
});
</script>

<style scoped>
.list-move {
  transition: all 0.5s ease;
}
.shareElement {
  max-width: 20em;
  display: flex;
  flex-direction: co;
}
</style>
