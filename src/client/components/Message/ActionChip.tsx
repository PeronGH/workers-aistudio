interface ActionChipProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

export function ActionChip({ label, icon, onClick }: ActionChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex items-center gap-1 px-1.5 py-0.5 text-[11px] text-kumo-subtle hover:text-kumo-default opacity-0 group-hover:opacity-100 transition-opacity"
    >
      {icon}
      {label}
    </button>
  );
}
