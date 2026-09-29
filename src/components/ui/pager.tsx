import { Children, useRef, useState, type ReactNode } from "react";
import { Keyboard, Pressable, ScrollView, View } from "react-native";

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
  /** Takes the height its parent gives (flex: 1), rather than the tallest page's. */
  fill?: boolean;
  /**
   * Grows into whatever room its parent has left (a screen that scrolls, with `flexGrow`
   * on its content), but is never shorter than its tallest page.
   */
  grow?: boolean;
  /** A page to swipe across to by itself as soon as the pager appears. */
  startPage?: number;
  children: ReactNode;
};

/**
 * Swipe left/right between same-sized pages, with a dot per page underneath.
 * Pages stretch to the tallest one, so a page can fill the space another sets.
 */
export function Pager({ labels, bleed = 0, fill, grow, startPage, children }: PagerProps) {
  const pages = Children.toArray(children);
  const [width, setWidth] = useState(0);
  const pageWidth = width + bleed * 2;
  const [page, setPage] = useState(0);
  const scroller = useRef<ScrollView>(null);
  const started = useRef(false);

  const show = (i: number) => {
    if (i === page) return;
    setPage(i);
    // A field on the page just left is out of sight, so it stops being typed in
    // (and anything laid out around the keyboard, like the timer's notes, settles back).
    Keyboard.dismiss();
  };

  const goTo = (i: number) => {
    scroller.current?.scrollTo({ x: i * pageWidth, animated: true });
    show(i);
  };

  return (
    <View
      style={[{ gap: space.sm }, fill && { flex: 1 }, grow && { flexGrow: 1 }]}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      {width > 0 && (
        <ScrollView
          ref={scroller}
          horizontal
          pagingEnabled
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          style={[{ marginHorizontal: -bleed }, fill && { flex: 1 }, grow && { flexGrow: 1 }]}
          keyboardShouldPersistTaps="handled"
          // Put away as soon as a swipe starts, so the keyboard (and anything laid out around it)
          // settles during the swipe rather than jumping once it's over.
          keyboardDismissMode="on-drag"
          onMomentumScrollEnd={(e) => show(Math.round(e.nativeEvent.contentOffset.x / pageWidth))}
          // The pages have to be laid out before there's anywhere to swipe to.
          onContentSizeChange={() => {
            if (!startPage || started.current) return;
            started.current = true;
            goTo(startPage);
          }}
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
