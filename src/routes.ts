import TextMerger from "./components/TextMerger.vue";
import TextSplitter from "./components/TextSplitter.vue";
export const routes = [
  { path: "/merge", component: TextMerger },
  { path: "/share", component: TextSplitter },
  { path: "/", redirect: "/share" },
];
