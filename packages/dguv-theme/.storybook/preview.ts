import type { Preview } from "@storybook/vue3-vite";
import { setup } from "@storybook/vue3-vite";
import PrimeVue from "primevue/config";
import ToastService from "primevue/toastservice";
import Tooltip from "primevue/tooltip";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Textarea from "primevue/textarea";
import Select from "primevue/select";
import RadioButton from "primevue/radiobutton";
import Checkbox from "primevue/checkbox";
import InputNumber from "primevue/inputnumber";
import Tag from "primevue/tag";
import Chip from "primevue/chip";
import Toast from "primevue/toast";
import ToggleSwitch from "primevue/toggleswitch";
import Divider from "primevue/divider";
import Message from "primevue/message";
import PhosphorVue from "@phosphor-icons/vue";
import "primeicons/primeicons.css";
import "./preview.css";
import { UVNexusPreset } from "../src/theme/index";

setup((app) => {
  app.use(PrimeVue, {
    theme: {
      preset: UVNexusPreset,
      options: {
        prefix: "p",
        darkModeSelector: ".my-app-dark",
      },
    },
  });
  app.use(ToastService);
  app.use(PhosphorVue);
  app.directive("tooltip", Tooltip);

  app.component("Button", Button);
  app.component("InputText", InputText);
  app.component("Textarea", Textarea);
  app.component("Select", Select);
  app.component("RadioButton", RadioButton);
  app.component("Checkbox", Checkbox);
  app.component("InputNumber", InputNumber);
  app.component("Tag", Tag);
  app.component("Chip", Chip);
  app.component("Toast", Toast);
  app.component("ToggleSwitch", ToggleSwitch);
  app.component("Divider", Divider);
  app.component("Message", Message);
});

// ─── Dark mode — toolbar button ─────────────────────────────────────────────
// Storybook's native globalTypes API adds a ☀ / ☾ selector to the toolbar.
// The decorator reads context.globals.colorScheme each render cycle and
// toggles ".my-app-dark" on <html>, activating PrimeVue's darkModeSelector.
// The Storybook manager UI theme is set separately in .storybook/manager.ts.
export const globalTypes = {
  colorScheme: {
    name: "Color scheme",
    toolbar: {
      icon: "sun",
      items: [
        { value: "light", title: "Light", icon: "sun" },
        { value: "dark", title: "Dark", icon: "moon" },
      ],
      dynamicTitle: true,
    },
  },
};

export const initialGlobals = {
  colorScheme: "light",
};

const preview: Preview = {
  parameters: {
    // Disable the backgrounds toolbar — canvas bg is controlled via preview.css.
    backgrounds: { disable: true },

    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    docs: {
      source: {
        // Extract the template literal and display it with HTML highlighting.
        transform: (code: string) => {
          const match = code.match(/template:\s*`([\s\S]*?)`,?\s*\n?\s*\}\)/);
          if (match) return match[1].replace(/^\n/, "").trimEnd();
          return code;
        },
        language: "html",
      },
    },
  },

  /**
   * Global decorator: applies the dark mode class to <html>
   * from the toolbar "Color scheme" selector.
   */
  decorators: [
    (story, context) => {
      document.documentElement.classList.toggle(
        "my-app-dark",
        (context.globals.colorScheme ?? "light") === "dark",
      );
      return story();
    },
  ],
};

export default preview;
