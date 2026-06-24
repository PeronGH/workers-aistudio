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
      "<|im_system|>system<|im_middle|>You are a helpful assistant.<|im_end|>" +
      "<|im_user|>user<|im_middle|>Hello<|im_end|>" +
      "<|im_assistant|>assistant<|im_middle|><think></think>"
  },
  {
    id: "glm-basic",
    label: "GLM — basic",
    models: ["glm"],
    build: () =>
      "[gMASK]<sop>" +
      "<|system|>Reasoning Effort: Max" +
      "<|system|>You are a helpful assistant." +
      "<|user|>Hello<|assistant|>\n<think></think>"
  }
];
