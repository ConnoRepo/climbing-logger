import { Image } from "expo-image";

// Exported unchanged from the Figma file (Simple Design System icons).
const sources = {
  calendar: require("@/assets/icons/calendar.svg"),
  home: require("@/assets/icons/home.svg"),
  image: require("@/assets/icons/image.svg"),
  link: require("@/assets/icons/link.svg"),
  loader: require("@/assets/icons/loader.svg"),
  // Not in Figma: Feather "trash-2", drawn to match the set above, in white.
  trash: require("@/assets/icons/trash.svg"),
};

export type IconName = keyof typeof sources;

export function Icon({ name, size = 48 }: { name: IconName; size?: number }) {
  return <Image source={sources[name]} style={{ width: size, height: size }} contentFit="contain" />;
}
