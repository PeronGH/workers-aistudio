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
    id: "ao3-fic",
    label: "AO3 fic",
    build: () =>
      `Rating:
Archive Warning:
Category:
Fandom:
Relationship:
Characters:
Additional Tags:
Language: English
Stats: Kudos: 18500 Bookmarks: 4200 Hits: 380000

---
Chapter 1

`
  }
];
