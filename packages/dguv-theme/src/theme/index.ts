import type { Preset } from "@primeuix/themes/types";
import type { AuraBaseDesignTokens } from "@primeuix/themes/aura/base";
import Aura from "@primeuix/themes/aura";
import { definePreset } from "@primeuix/themes";
import base from "./base";
import button from "./button";

export const UVNexusPreset = definePreset(Aura, {
  ...base,
  components: {
    button,
  },
} satisfies Preset<AuraBaseDesignTokens>);
