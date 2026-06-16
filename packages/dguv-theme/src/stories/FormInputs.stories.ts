import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";

const meta: Meta = {
  title: "Form/Form Collage",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "A complete contact form demonstrating all UV Nexus form components together.",
      },
    },
  },
};
export default meta;
type Story = StoryObj;

export const ContactForm: Story = {
  name: "Contact Form",
  parameters: { controls: { disable: true } },
  render: () => ({
    setup() {
      const name = ref("");
      const email = ref("");
      const message = ref("");
      const category = ref(null);
      const priority = ref("medium");
      const subscribe = ref(false);
      const notifications = ref(true);
      const categories = [
        { label: "Bug Report", value: "bug" },
        { label: "Feature Request", value: "feature" },
        { label: "General Inquiry", value: "general" },
      ];
      return {
        name,
        email,
        message,
        category,
        priority,
        subscribe,
        notifications,
        categories,
      };
    },
    template: `
      <div class="p-6 max-w-lg bg-white border border-gray-200 rounded">
        <h2 class="text-lg font-semibold text-gray-900 mb-6">Contact Form</h2>
        <div class="flex flex-col gap-5">
          <div class="flex flex-col gap-2">
            <label class="font-semibold text-sm">Full Name *</label>
            <InputText v-model="name" placeholder="Jane Doe" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="font-semibold text-sm">Email *</label>
            <InputText v-model="email" type="email" placeholder="jane@example.com" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="font-semibold text-sm">Category</label>
            <Select v-model="category" :options="categories" option-label="label" placeholder="Select category" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="font-semibold text-sm">Priority</label>
            <div class="flex gap-6">
              <div class="flex items-center gap-2">
                <RadioButton v-model="priority" input-id="low" name="priority" value="low" />
                <label for="low" class="cursor-pointer">Low</label>
              </div>
              <div class="flex items-center gap-2">
                <RadioButton v-model="priority" input-id="medium" name="priority" value="medium" />
                <label for="medium" class="cursor-pointer">Medium</label>
              </div>
              <div class="flex items-center gap-2">
                <RadioButton v-model="priority" input-id="high" name="priority" value="high" />
                <label for="high" class="cursor-pointer">High</label>
              </div>
            </div>
          </div>
          <div class="flex flex-col gap-2">
            <label class="font-semibold text-sm">Message</label>
            <Textarea v-model="message" placeholder="Describe your issue…" rows="4" />
          </div>
          <div class="flex flex-col gap-3">
            <div class="flex items-center gap-3">
              <Checkbox v-model="subscribe" input-id="subscribe" :binary="true" />
              <label for="subscribe" class="cursor-pointer text-sm">Subscribe to updates</label>
            </div>
            <div class="flex items-center gap-3">
              <ToggleSwitch v-model="notifications" input-id="notif" />
              <label for="notif" class="cursor-pointer text-sm">Enable email notifications</label>
            </div>
          </div>
          <Divider />
          <div class="flex gap-3 justify-end">
            <Button label="Cancel" severity="secondary" variant="outlined" />
            <Button label="Submit" icon="pi pi-send" />
          </div>
        </div>
      </div>
    `,
  }),
};

// Individual form element stories have moved to the Form/ folder:
// Form/InputText, Form/Textarea, Form/Select, Form/RadioButton, Form/Checkbox, Form/ToggleSwitch
