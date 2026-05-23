import { Button } from "@cloudflare/kumo";
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
        <Button
          variant="ghost"
          size="xs"
          shape="square"
          aria-label="Previous sibling"
          icon={<CaretLeftIcon size={12} />}
          onClick={onPrev}
          disabled={index === 0}
        />
        <span className="tabular-nums">
          {index + 1}/{count}
        </span>
        <Button
          variant="ghost"
          size="xs"
          shape="square"
          aria-label="Next sibling"
          icon={<CaretRightIcon size={12} />}
          onClick={onNext}
          disabled={index === count - 1}
        />
      </div>
    </div>
  );
}
