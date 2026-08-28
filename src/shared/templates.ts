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
      "<|user|>USER<|assistant|><think>THINKING</think>"
  },
  {
    id: "qwen-basic",
    label: "Qwen - basic",
    build: () =>
      "<|im_start|>system\nSYSTEM<|im_end|>\n" +
      "<|im_start|>user\nUSER<|im_end|>\n" +
      "<|im_start|>assistant\n<think>\nTHINKING\n</think>\n\n"
  },
  {
    id: "deepseek-basic",
    label: "DeepSeek - basic",
    build: () =>
      `<｜begin▁of▁sentence｜>SYSTEM<｜User｜>USER<｜Assistant｜><think>THINKING</think>`
  },
  {
    id: "deepseek-fim",
    label: "DeepSeek - FIM",
    build: () => `<｜fim▁begin｜>PREFIX<｜fim▁hole｜>SUFFIX<｜fim▁end｜>`
  }
];
