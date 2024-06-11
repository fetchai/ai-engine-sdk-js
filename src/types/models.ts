export interface CustomModel {
  id: string;
  name: string;
}

const modelNames = {
  "thoughtful-01": "Thoughtful",
  "talkative-01": "Talkative",
  "talkative-02": "Talkative 2",
  "talkative-03": "Talkative 3",
  "creative-01": "Creative",
  "creative-02": "Creative 2",
  "creative-03": "Creative 3",
  "creative-04": "Creative 4",
  "gemini-pro": "Gemini Pro",
  "next-gen": "Next Generation",
  "ml-recommender-01": "ML Recommender",
};

export type KnownModelId = keyof typeof modelNames;

export const DefaultModelIds: KnownModelId[] = [
  "thoughtful-01",
  "talkative-01",
  "creative-01",
  "gemini-pro",
  "next-gen",
  "ml-recommender-01",
];

export const DefaultModelId: KnownModelId = "talkative-01";

export function getModelId(model: KnownModelId | CustomModel): string {
  return typeof model === "string" ? model : model.id;
}

export function getModelName(model: KnownModelId | CustomModel): string {
  return typeof model === "string" ? modelNames[model] : model.name;
}
