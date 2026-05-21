import { z } from "zod";
import { UiMessageSchema } from "./messages";
import { RunSettingsSchema } from "./settings";

export const CURRENT_VERSION = 1;

export const ConversationStateSchema = z.object({
  version: z.literal(CURRENT_VERSION),
  messages: z.array(UiMessageSchema),
  settings: RunSettingsSchema
});

export type ConversationState = z.infer<typeof ConversationStateSchema>;
