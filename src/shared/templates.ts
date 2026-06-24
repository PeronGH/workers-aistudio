export interface PromptTemplate {
  id: string;
  label: string;
  models: string[];
  build: () => string;
}

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: "kimi-basic",
    label: "Kimi — basic",
    models: ["kimi"],
    build: () =>
      "<|im_system|>system<|im_middle|>SYSTEM<|im_end|>" +
      "<|im_user|>user<|im_middle|>USER<|im_end|>" +
      "<|im_assistant|>assistant<|im_middle|><think>THINKING</think>"
  },
  {
    id: "glm-basic",
    label: "GLM — basic",
    models: ["glm"],
    build: () =>
      "[gMASK]<sop>" +
      "<|system|>Reasoning Effort: Max" +
      "<|system|>SYSTEM" +
      "<|user|>USER<|assistant|>\n<think>THINKING</think>"
  }
];
