import { Children, useRef, useState, type ReactNode } from "react";
import { Pressable, ScrollView, View } from "react-native";

import { colors, space } from "@/constants/theme";

const DOT = 8;

type PagerProps = {
  /** One per page, in order: names the dots for accessibility. */
  labels: string[];
  /**
   * How far the pages reach past the pager on each side, e.g. into the screen's padding.
   * Pages get the extra width; pad the ones that should stay in line with the content.
   */
  bleed?: number;
  children: ReactNode;
};

/**
 * Swipe left/right between same-sized pages, with a dot per page underneath.
 * Pages stretch to the tallest one, so a page can fill the space another sets.
 */
export function Pager({ labels, bleed = 0, children }: PagerProps) {
  const pages = Children.toArray(children);
  const [width, setWidth] = useState(0);
  const pageWidth = width + bleed * 2;
  const [page, setPage] = useState(0);
  const scroller = useRef<ScrollView>(null);

  const goTo = (i: number) => {
    scroller.current?.scrollTo({ x: i * pageWidth, animated: true });
    setPage(i);
  };

  return (
    <View style={{ gap: space.sm }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <ScrollView
          ref={scroller}
          horizontal
          pagingEnabled
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: -bleed }}
          keyboardShouldPersistTaps="handled"
          onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / pageWidth))}
        >
          {pages.map((child, i) => (
            <View key={i} style={{ width: pageWidth }}>
              {child}
            </View>
          ))}
        </ScrollView>
      )}

      <View style={{ flexDirection: "row", justifyContent: "center", gap: DOT }}>
        {pages.map((_, i) => (
          <Pressable
            key={i}
            accessibilityRole="button"
            accessibilityLabel={`Show ${labels[i]}`}
            accessibilityState={{ selected: i === page }}
            onPress={() => goTo(i)}
            hitSlop={8}
            style={{
              width: DOT,
              height: DOT,
              borderRadius: DOT / 2,
              backgroundColor: i === page ? colors.ink : colors.fill,
            }}
          />
        ))}
      </View>
    </View>
  );
}
