export interface PromptTemplate {
  id: string;
  label: string;
  build: () => string;
}

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: "kimi-basic",
    label: "Kimi - basic",
    build: () =>
      "<|im_system|>system<|im_middle|>SYSTEM<|im_end|>" +
      "<|im_user|>user<|im_middle|>USER<|im_end|>" +
      "<|im_assistant|>assistant<|im_middle|><think>THINKING</think>"
  },
  {
    id: "glm-basic",
    label: "GLM - basic",
    build: () =>
      "[gMASK]<sop>" +
      "<|system|>Reasoning Effort: Max" +
      "<|system|>SYSTEM" +
      "<|user|>USER<|assistant|>\n<think>THINKING</think>"
  },
  {
    id: "creative-writing",
    label: "Creative writing",
    build: () =>
      `Rating:
Language: English
Words: 5000
Kudos: 18500
Tags: `
  }
];
