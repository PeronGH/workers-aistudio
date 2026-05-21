import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";

interface SiblingNavProps {
  align: "justify-start" | "justify-end";
  index: number;
  count: number;
  onPrev: () => void;
  onNext: () => void;
}

export function SiblingNav({
  align,
  index,
  count,
  onPrev,
  onNext
}: SiblingNavProps) {
  return (
    <div className={`flex ${align}`}>
      <div className="inline-flex items-center gap-1 text-[11px] text-kumo-subtle">
        <button
          type="button"
          aria-label="Previous sibling"
          onClick={onPrev}
          disabled={index === 0}
          className="p-0.5 rounded hover:text-kumo-default disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <CaretLeftIcon size={12} />
        </button>
        <span className="tabular-nums">
          {index + 1}/{count}
        </span>
        <button
          type="button"
          aria-label="Next sibling"
          onClick={onNext}
          disabled={index === count - 1}
          className="p-0.5 rounded hover:text-kumo-default disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <CaretRightIcon size={12} />
        </button>
      </div>
    </div>
  );
}
