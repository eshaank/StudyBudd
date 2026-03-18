import { useEffect, useRef } from "react";

export function useShake(trigger) {
  const ref = useRef(null);
  useEffect(() => {
    if (!trigger || !ref.current) return;
    ref.current.classList.remove("qz-shake");
    void ref.current.offsetWidth;
    ref.current.classList.add("qz-shake");
    const t = setTimeout(() => ref.current?.classList.remove("qz-shake"), 600);
    return () => clearTimeout(t);
  }, [trigger]);
  return ref;
}
