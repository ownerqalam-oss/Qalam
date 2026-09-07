export const prompts = [
  "What's a dua you've been repeating this week, and why?",
  "Write about a moment when patience felt heavy but paid off.",
  "Write a letter to yourself from five years ago.",
  "What verse or hadith has stayed with you lately, and what does it mean to you right now?",
  "Write about a person whose sincerity changed how you see faith.",
  "What does it feel like when a prayer is finally answered?",
];

export function getRandomPrompt(excludeIndex?: number): number {
  if (prompts.length <= 1) return 0;

  let index = Math.floor(Math.random() * prompts.length);

  while (index === excludeIndex) {
    index = Math.floor(Math.random() * prompts.length);
  }

  return index;
}
