import { defineStore } from "pinia";

export const outputFormats = ["decimal", "hex", "base64"] as const;
export type OutputFormat = (typeof outputFormats)[number];

export const useOutputConfigStore = defineStore("outputConfig", {
  state() {
    return {
      outputFormat: "hex" as OutputFormat,
    };
  },
});
