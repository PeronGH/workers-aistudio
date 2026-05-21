import { useState } from "react";
import { Button, Input, Surface, Switch, Text } from "@cloudflare/kumo";
import { Collapsible } from "@cloudflare/kumo/components/collapsible";
import { CaretDownIcon, CaretRightIcon, XIcon } from "@phosphor-icons/react";
import {
  PENALTY_RANGE,
  SEARCH_CONTEXT_SIZES,
  STOP_MAX,
  TEMPERATURE_RANGE,
  THINKING_LEVELS,
  TOP_P_RANGE,
  type RunSettings,
  type SearchContextSize,
  type ThinkingLevel
} from "../../shared/settings";

interface SettingsPanelProps {
  settings: RunSettings;
  onUpdate: (patch: Partial<RunSettings>) => void;
  onReset: () => void;
}

export function SettingsPanel({
  settings,
  onUpdate,
  onReset
}: SettingsPanelProps) {
  return (
    <aside className="w-[340px] shrink-0 border-l border-kumo-line bg-kumo-base overflow-y-auto">
      <div className="p-4 space-y-5">
        <div className="flex items-center justify-between">
          <Text size="sm" bold>
            Run settings
          </Text>
          <Button variant="ghost" size="sm" onClick={onReset}>
            Clear all
          </Button>
        </div>

        <SystemPromptField
          value={settings.systemPrompt}
          onChange={(v) => onUpdate({ systemPrompt: v })}
        />

        <NumberSlider
          label="Temperature"
          value={settings.temperature}
          range={TEMPERATURE_RANGE}
          seed={1}
          onChange={(v) => onUpdate({ temperature: v })}
        />
        <NumberSlider
          label="Top P"
          value={settings.top_p}
          range={TOP_P_RANGE}
          seed={1}
          onChange={(v) => onUpdate({ top_p: v })}
        />
        <NumberInputField
          label="Max completion tokens"
          value={settings.max_completion_tokens}
          seed={1024}
          min={1}
          onChange={(v) => onUpdate({ max_completion_tokens: v })}
        />
        <StopField
          value={settings.stop}
          onChange={(v) => onUpdate({ stop: v })}
        />
        <ThinkingField
          value={settings.thinking}
          onChange={(v) => onUpdate({ thinking: v })}
        />
        <WebSearchField
          value={settings.web_search}
          onChange={(v) => onUpdate({ web_search: v })}
        />

        <AdvancedSection>
          <NumberSlider
            label="Frequency penalty"
            value={settings.frequency_penalty}
            range={PENALTY_RANGE}
            seed={0}
            onChange={(v) => onUpdate({ frequency_penalty: v })}
          />
          <NumberSlider
            label="Presence penalty"
            value={settings.presence_penalty}
            range={PENALTY_RANGE}
            seed={0}
            onChange={(v) => onUpdate({ presence_penalty: v })}
          />
          <NumberInputField
            label="Seed"
            value={settings.seed}
            seed={0}
            onChange={(v) => onUpdate({ seed: v })}
          />
        </AdvancedSection>
      </div>
    </aside>
  );
}

function SystemPromptField({
  value,
  onChange
}: {
  value: string | undefined;
  onChange: (v: string | undefined) => void;
}) {
  return (
    <section className="space-y-1.5">
      <Label>System instructions</Label>
      <textarea
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || undefined)}
        placeholder="No system prompt — model uses its own default."
        rows={5}
        className="w-full px-3 py-2 text-sm rounded-lg border border-kumo-line bg-kumo-base text-kumo-default placeholder:text-kumo-inactive focus:outline-none focus:ring-1 focus:ring-kumo-accent resize-y"
      />
    </section>
  );
}

function NumberSlider({
  label,
  value,
  range,
  seed,
  onChange
}: {
  label: string;
  value: number | undefined;
  range: { min: number; max: number; step: number };
  seed: number;
  onChange: (v: number | undefined) => void;
}) {
  const enabled = value !== undefined;
  const display = value ?? seed;
  return (
    <ToggleRow
      label={label}
      enabled={enabled}
      onToggle={(on) => onChange(on ? seed : undefined)}
      detail={enabled ? display.toFixed(2) : "default"}
    >
      <input
        type="range"
        min={range.min}
        max={range.max}
        step={range.step}
        value={display}
        disabled={!enabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-kumo-brand disabled:opacity-40"
      />
    </ToggleRow>
  );
}

function NumberInputField({
  label,
  value,
  seed,
  min,
  onChange
}: {
  label: string;
  value: number | undefined;
  seed: number;
  min?: number;
  onChange: (v: number | undefined) => void;
}) {
  const enabled = value !== undefined;
  return (
    <ToggleRow
      label={label}
      enabled={enabled}
      onToggle={(on) => onChange(on ? seed : undefined)}
      detail={enabled ? String(value) : "default"}
    >
      <Input
        type="number"
        min={min}
        value={value ?? seed}
        disabled={!enabled}
        onChange={(e) => {
          const n = Number((e.target as HTMLInputElement).value);
          if (!Number.isNaN(n)) onChange(n);
        }}
      />
    </ToggleRow>
  );
}

function StopField({
  value,
  onChange
}: {
  value: string[] | undefined;
  onChange: (v: string[] | undefined) => void;
}) {
  const [draft, setDraft] = useState("");
  const items = value ?? [];

  const add = () => {
    const v = draft.trim();
    if (!v || items.includes(v) || items.length >= STOP_MAX) return;
    onChange([...items, v]);
    setDraft("");
  };

  const remove = (s: string) => {
    const next = items.filter((x) => x !== s);
    onChange(next.length === 0 ? undefined : next);
  };

  return (
    <section className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label>Stop sequences</Label>
        <Text size="xs" variant="secondary">
          {items.length}/{STOP_MAX}
        </Text>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((s) => (
          <span
            key={s}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-kumo-control text-xs font-mono text-kumo-default"
          >
            {s}
            <button
              type="button"
              onClick={() => remove(s)}
              aria-label={`Remove ${s}`}
              className="text-kumo-subtle hover:text-kumo-default"
            >
              <XIcon size={10} />
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add();
          }
        }}
        onBlur={add}
        placeholder={items.length >= STOP_MAX ? "Max 4" : "Press Enter to add"}
        disabled={items.length >= STOP_MAX}
        className="w-full px-2.5 py-1.5 text-sm font-mono rounded-lg border border-kumo-line bg-kumo-base text-kumo-default placeholder:text-kumo-inactive focus:outline-none focus:ring-1 focus:ring-kumo-accent disabled:opacity-40"
      />
    </section>
  );
}

function ThinkingField({
  value,
  onChange
}: {
  value: ThinkingLevel | undefined;
  onChange: (v: ThinkingLevel | undefined) => void;
}) {
  const enabled = value !== undefined;
  return (
    <ToggleRow
      label="Thinking"
      enabled={enabled}
      onToggle={(on) => onChange(on ? "medium" : undefined)}
      detail={enabled ? value : "default"}
    >
      <Segmented
        options={THINKING_LEVELS}
        value={value ?? "medium"}
        disabled={!enabled}
        onChange={onChange}
      />
    </ToggleRow>
  );
}

function WebSearchField({
  value,
  onChange
}: {
  value: { search_context_size: SearchContextSize } | undefined;
  onChange: (v: { search_context_size: SearchContextSize } | undefined) => void;
}) {
  const enabled = value !== undefined;
  return (
    <ToggleRow
      label="Web search"
      enabled={enabled}
      onToggle={(on) =>
        onChange(on ? { search_context_size: "medium" } : undefined)
      }
      detail={enabled ? value.search_context_size : "off"}
    >
      <Segmented
        options={SEARCH_CONTEXT_SIZES}
        value={value?.search_context_size ?? "medium"}
        disabled={!enabled}
        onChange={(v) => onChange({ search_context_size: v })}
      />
    </ToggleRow>
  );
}

function ToggleRow({
  label,
  enabled,
  onToggle,
  detail,
  children
}: {
  label: string;
  enabled: boolean;
  onToggle: (on: boolean) => void;
  detail: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <div className="flex items-center gap-2">
          <Text size="xs" variant="secondary">
            {detail}
          </Text>
          <Switch
            checked={enabled}
            onCheckedChange={onToggle}
            size="sm"
            aria-label={`Enable ${label}`}
          />
        </div>
      </div>
      <div className={enabled ? "" : "opacity-50 pointer-events-none"}>
        {children}
      </div>
    </section>
  );
}

function Segmented<T extends string>({
  options,
  value,
  disabled,
  onChange
}: {
  options: readonly T[];
  value: T;
  disabled?: boolean;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex w-full rounded-lg border border-kumo-line overflow-hidden">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          disabled={disabled}
          onClick={() => onChange(opt)}
          className={`flex-1 px-2 py-1 text-xs font-medium transition-colors ${
            value === opt
              ? "bg-kumo-contrast text-kumo-inverse"
              : "bg-kumo-base text-kumo-default hover:bg-kumo-control"
          } disabled:cursor-not-allowed`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function AdvancedSection({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible.Root open={open} onOpenChange={setOpen}>
      <Collapsible.Trigger className="flex items-center gap-1.5 w-full text-left py-1.5 border-t border-kumo-line pt-3">
        {open ? <CaretDownIcon size={12} /> : <CaretRightIcon size={12} />}
        <Text size="xs" bold variant="secondary">
          Advanced
        </Text>
      </Collapsible.Trigger>
      <Collapsible.Panel>
        <Surface className="space-y-4 pt-3">{children}</Surface>
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <Text size="xs" bold variant="secondary" as="span">
      {children}
    </Text>
  );
}
