import { useEffect, useRef, useState } from "react";

/**
 * Text that is reported live via `onChange`, and once more via `onCommit`
 * when editing finishes (blur, submit or unmount). Use `onCommit` for work
 * that shouldn't see half-typed values, like linking to the exercise library.
 */
export function useCommittedText(
  initial: string,
  { onChange, onCommit }: { onChange?: (value: string) => void; onCommit: (value: string) => void },
) {
  const [value, setValue] = useState(initial);
  const latest = useRef(initial);
  const committed = useRef(initial);
  const handlers = useRef({ onChange, onCommit });

  useEffect(() => {
    handlers.current = { onChange, onCommit };
  });

  function flush() {
    if (latest.current !== committed.current) {
      committed.current = latest.current;
      handlers.current.onCommit(latest.current);
    }
  }

  // Leaving the screen while still typing counts as finishing.
  useEffect(() => () => flush(), []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    value,
    onChangeText: (text: string) => {
      latest.current = text;
      setValue(text);
      handlers.current.onChange?.(text);
    },
    onBlur: flush,
    onSubmitEditing: flush,
  };
}
