import { useState } from "react";
import { Pressable, StyleSheet, View, type TextStyle } from "react-native";
import Svg, { Line, Polyline } from "react-native-svg";

import { AppText, Box } from "@/components/ui";
import { borders, colors, space, type } from "@/constants/theme";
import { formatWeight } from "@/data/format";
import type { WeightPoint } from "@/data/progress";
import { addDays, daysBetween, formatAxisDate, formatShortDate, toKey, type DateKey } from "@/lib/dates";

// The graph always shows the last 4 weeks, ending today.
// TODO: make the time range customizable (e.g. 1 week / 3 months / all time) later.
const WINDOW_DAYS = 28;
const X_TICK_EVERY_DAYS = 7;

/** The top of the y axis is always this much heavier than the heaviest point. */
const HEADROOM_LB = 5;
const MAX_Y_INTERVALS = 5;
const Y_STEPS = [5, 10, 20, 25, 50, 100, 200, 500];

/** Room around the plot for the axis marks; everything else is plot. */
const PLOT = { left: 44, right: space.md, top: 10, bottom: 28 };
const LABEL_H = type.axis.lineHeight;
const X_LABEL_W = 48;
const TICK = 5;
/** Ink lines: a touch lighter than the thick box borders. The faint grid stays hairline. */
const LINE = borders.thin;
const GRID = borders.hairline;

const DOT = 11;
const DOT_SELECTED = 15;
const HIT = 44;
const CALLOUT_W = 120;
const CALLOUT_H = 56;
const CALLOUT_GAP = 12;

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

type Size = { width: number; height: number };

/**
 * Weight range and gridline values. The top is the heaviest point + 5 lb; the bottom
 * sits 5 lb under the lightest, rounded to 5 and never below 0 unless a set was assisted.
 */
function weightAxis(weights: number[]) {
  const top = Math.max(...weights) + HEADROOM_LB;
  const lightest = Math.min(...weights);
  const under = Math.floor((lightest - HEADROOM_LB) / 5) * 5;
  const bottom = lightest >= 0 ? Math.max(0, under) : under;
  const step = Y_STEPS.find((s) => (top - bottom) / s <= MAX_Y_INTERVALS) ?? Y_STEPS[Y_STEPS.length - 1];
  const ticks: number[] = [];
  for (let v = Math.ceil(bottom / step) * step; v <= top; v += step) ticks.push(v);
  return { top, bottom, ticks };
}

/**
 * Weight over the last 4 weeks for one workout. Unframed: the axes are its edges,
 * and it fills its parent so it can match the size of whatever it sits beside.
 * Tap a point for its weight and date; the heaviest one is gold.
 */
export function WeightGraph({ points }: { points: WeightPoint[] }) {
  const [size, setSize] = useState<Size | null>(null);
  const [selected, setSelected] = useState<DateKey | null>(null);

  const end = toKey(new Date());
  const start = addDays(end, -WINDOW_DAYS);
  const visible = points.filter((p) => p.date >= start && p.date <= end);

  return (
    <View
      style={{ flex: 1, overflow: "hidden" }}
      onLayout={(e) => setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
    >
      {visible.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: space.md }}>
          <AppText variant="note" color={colors.placeholder} align="center">
            No weight logged in the last 4 weeks.{"\n"}Check off sets to start the graph.
          </AppText>
        </View>
      ) : (
        size && <Plot points={visible} start={start} size={size} selected={selected} onSelect={setSelected} />
      )}
    </View>
  );
}

type PlotProps = {
  points: WeightPoint[];
  start: DateKey;
  size: Size;
  selected: DateKey | null;
  onSelect: (date: DateKey | null) => void;
};

function Plot({ points, start, size, selected, onSelect }: PlotProps) {
  const [x0, x1] = [PLOT.left, size.width - PLOT.right];
  const [y0, y1] = [PLOT.top, size.height - PLOT.bottom];
  const axis = weightAxis(points.map((p) => p.weightLb));

  const xOf = (date: DateKey) => x0 + (daysBetween(start, date) / WINDOW_DAYS) * (x1 - x0);
  const yOf = (lb: number) => y1 - ((lb - axis.bottom) / (axis.top - axis.bottom)) * (y1 - y0);

  const plotted = points.map((p) => ({ ...p, x: xOf(p.date), y: yOf(p.weightLb) }));
  // The first day the heaviest weight was reached.
  const best = points.reduce((a, b) => (b.weightLb > a.weightLb ? b : a));
  const active = plotted.find((p) => p.date === selected);
  const dateTicks = Array.from({ length: WINDOW_DAYS / X_TICK_EVERY_DAYS + 1 }, (_, i) =>
    addDays(start, i * X_TICK_EVERY_DAYS),
  );

  return (
    <>
      <Svg width={size.width} height={size.height} style={StyleSheet.absoluteFill}>
        {/* Faint graph-paper lines, then the ink axes and their tick marks. */}
        {axis.ticks.map((lb) => (
          <Line key={`y${lb}`} x1={x0} x2={x1} y1={yOf(lb)} y2={yOf(lb)} stroke={colors.fillLight} strokeWidth={GRID} />
        ))}
        {dateTicks.map((d) => (
          <Line key={`x${d}`} x1={xOf(d)} x2={xOf(d)} y1={y0} y2={y1} stroke={colors.fillLight} strokeWidth={GRID} />
        ))}
        <Line x1={x0} x2={x0} y1={y0} y2={y1} stroke={colors.ink} strokeWidth={LINE} strokeLinecap="square" />
        <Line x1={x0} x2={x1} y1={y1} y2={y1} stroke={colors.ink} strokeWidth={LINE} strokeLinecap="square" />
        {axis.ticks.map((lb) => (
          <Line key={`yt${lb}`} x1={x0 - TICK} x2={x0} y1={yOf(lb)} y2={yOf(lb)} stroke={colors.ink} strokeWidth={LINE} />
        ))}
        {dateTicks.map((d) => (
          <Line key={`xt${d}`} x1={xOf(d)} x2={xOf(d)} y1={y1} y2={y1 + TICK} stroke={colors.ink} strokeWidth={LINE} />
        ))}

        {plotted.length > 1 && (
          <Polyline
            points={plotted.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke={colors.ink}
            strokeWidth={LINE}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
      </Svg>

      {/* Tapping anywhere off a point clears the selection. */}
      <Pressable accessible={false} style={StyleSheet.absoluteFill} onPress={() => onSelect(null)} />

      {axis.ticks.map((lb) => (
        <AxisLabel key={lb} style={{ left: 0, width: x0 - TICK - 3, top: yOf(lb) - LABEL_H / 2, textAlign: "right" }}>
          {`${lb} lb`}
        </AxisLabel>
      ))}
      {dateTicks.map((d) => (
        <AxisLabel
          key={d}
          style={{
            left: clamp(xOf(d) - X_LABEL_W / 2, 2, size.width - X_LABEL_W - 2),
            width: X_LABEL_W,
            top: y1 + TICK + 3,
            textAlign: "center",
          }}
        >
          {formatAxisDate(d)}
        </AxisLabel>
      ))}

      {plotted.map((p) => {
        const isActive = p.date === selected;
        const isBest = p.date === best.date;
        const dot = isActive ? DOT_SELECTED : DOT;
        return (
          <Pressable
            key={p.date}
            accessibilityRole="button"
            accessibilityLabel={`${formatWeight(p.weightLb)} on ${formatShortDate(p.date)}${isBest ? ", heaviest" : ""}`}
            accessibilityState={{ selected: isActive }}
            onPress={() => onSelect(isActive ? null : p.date)}
            style={{
              position: "absolute",
              left: p.x - HIT / 2,
              top: p.y - HIT / 2,
              width: HIT,
              height: HIT,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View
              style={{
                width: dot,
                height: dot,
                borderRadius: dot / 2,
                backgroundColor: isBest ? colors.gold : isActive ? colors.ink : colors.graphDot,
                // Light gold needs an outline to read on white paper.
                borderWidth: isBest ? (isActive ? borders.thin : borders.hairline) : 0,
                borderColor: colors.ink,
              }}
            />
          </Pressable>
        );
      })}

      {active && <Callout point={active} size={size} />}
    </>
  );
}

function AxisLabel({ style, children }: { style: TextStyle; children: string }) {
  return (
    <AppText
      variant="axis"
      color={colors.inkSoft}
      numberOfLines={1}
      style={[{ position: "absolute", pointerEvents: "none" }, style]}
    >
      {children}
    </AppText>
  );
}

/** Weight and date above the tapped point; flips below it near the top, and stays inside the frame. */
function Callout({ point, size }: { point: { x: number; y: number } & WeightPoint; size: Size }) {
  const above = point.y - CALLOUT_GAP - CALLOUT_H;
  const top = above >= 4 ? above : point.y + CALLOUT_GAP;
  const left = clamp(point.x - CALLOUT_W / 2, 4, size.width - CALLOUT_W - 4);

  return (
    <Box
      border="thin"
      style={{
        position: "absolute",
        pointerEvents: "none",
        left,
        top: clamp(top, 4, size.height - CALLOUT_H - 4),
        width: CALLOUT_W,
        height: CALLOUT_H,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <AppText variant="label">{formatWeight(point.weightLb)}</AppText>
      <AppText variant="note">{formatShortDate(point.date)}</AppText>
    </Box>
  );
}
