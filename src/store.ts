import { defineStore } from "pinia";

export const outputFormats = ["decimal", "hex"] as const;
export type OutputFormat = (typeof outputFormats)[number];

export const useOutputConfigStore = defineStore("outputConfig", {
  state() {
    return {
      outputFormat: "hex" as OutputFormat,
    };
  },
});
