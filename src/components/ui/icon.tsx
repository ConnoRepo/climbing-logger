import { Image } from "expo-image";

import type { Category } from "@/data/types";

// Exported unchanged from the Figma file (Simple Design System icons).
const sources = {
  calendar: require("@/assets/icons/calendar.svg"),
  home: require("@/assets/icons/home.svg"),
  image: require("@/assets/icons/image.svg"),
  link: require("@/assets/icons/link.svg"),
  loader: require("@/assets/icons/loader.svg"),
  // Not in Figma: an open hand for Fingers, drawn to match the set above.
  fingers: require("@/assets/icons/fingers.svg"),
  // Not in Figma: Feather "trash-2", drawn to match the set above, in white.
  trash: require("@/assets/icons/trash.svg"),
};

export type IconName = keyof typeof sources;

/** Each workout category's icon. */
export const CATEGORY_ICONS: Record<Category, IconName> = {
  climbing: "image",
  fingers: "fingers",
  workout: "link",
  mobility: "loader",
};

export function Icon({ name, size = 48 }: { name: IconName; size?: number }) {
  return <Image source={sources[name]} style={{ width: size, height: size }} contentFit="contain" />;
}
