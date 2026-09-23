import type { BottomTabBarProps } from "expo-router/tabs";
import { Tabs } from "expo-router";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon, type IconName } from "@/components/ui";
import { colors } from "@/constants/theme";

const TAB_ICONS: Record<string, IconName> = {
  calendar: "calendar",
  index: "home",
};

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <NotebookTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.paper } }}
    >
      <Tabs.Screen name="calendar" options={{ title: "Calendar" }} />
      <Tabs.Screen name="index" options={{ title: "Home" }} />
    </Tabs>
  );
}

/** Bare ink icons on paper, laid out like the Figma "Tab Bar" frame. */
function NotebookTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { bottom } = useSafeAreaInsets();

  return (
    <View
      style={{
        flexDirection: "row",
        gap: 93,
        paddingLeft: 48,
        paddingTop: 17,
        paddingBottom: Math.max(bottom, 17),
        backgroundColor: colors.paper,
      }}
    >
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={descriptors[route.key].options.title}
            hitSlop={12}
            onPress={() => {
              const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            }}
            style={{ opacity: focused ? 1 : 0.35 }}
          >
            <Icon name={TAB_ICONS[route.name]} size={40} />
          </Pressable>
        );
      })}
    </View>
  );
}
