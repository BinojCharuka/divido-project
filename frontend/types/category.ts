/**
 * Categories and Kakeibo group models based on docs/05-api/categories-api.md
 * and docs/05-api/openapi.yaml.
 */

export type KakeiboGroup = "NEEDS" | "WANTS" | "CULTURE" | "UNEXPECTED";

export interface Category {
  id: string;
  name: string;
  group: KakeiboGroup;
  isDefault: boolean;
  active: boolean;
}

export interface CategoriesResponse {
  items: Category[];
}

export const KAKEIBO_GROUPS: { id: KakeiboGroup; label: string; description: string }[] = [
  { id: "NEEDS", label: "Needs", description: "Essential expenses (housing, food, transport, bills)" },
  { id: "WANTS", label: "Wants", description: "Enjoyable but non-essential spending" },
  { id: "CULTURE", label: "Culture", description: "Books, learning, arts, and personal growth" },
  { id: "UNEXPECTED", label: "Unexpected", description: "Unforeseen emergencies or repair expenses" },
];
