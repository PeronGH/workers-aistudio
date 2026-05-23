import { Button, InputArea, Switch, Text } from "@cloudflare/kumo";
import {
  DEFAULT_PRESET,
  PRESETS,
  PRESET_VALUES,
  TEMPERATURE_RANGE,
  TOP_P_RANGE,
  type Preset,
  type RunSettings
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

        <SamplingFields settings={settings} onUpdate={onUpdate} />
      </div>
    </aside>
  );
}

function SamplingFields({
  settings,
  onUpdate
}: {
  settings: RunSettings;
  onUpdate: (patch: Partial<RunSettings>) => void;
}) {
  const preset = settings.preset ?? DEFAULT_PRESET;
  const isManual = preset === "manual";
  const presetValues = isManual ? null : PRESET_VALUES[preset];
  const temperature = presetValues
    ? presetValues.temperature
    : (settings.temperature ?? 1.0);
  const topP = presetValues ? presetValues.top_p : (settings.top_p ?? 0.95);
  const thinking = presetValues ? presetValues.thinking : settings.thinking;
  return (
    <>
      <PresetField value={preset} onChange={(v) => onUpdate({ preset: v })} />
      <SamplingSlider
        label="Temperature"
        value={temperature}
        range={TEMPERATURE_RANGE}
        disabled={!isManual}
        onChange={(v) => onUpdate({ temperature: v })}
      />
      <SamplingSlider
        label="Top P"
        value={topP}
        range={TOP_P_RANGE}
        disabled={!isManual}
        onChange={(v) => onUpdate({ top_p: v })}
      />
      <SamplingThinkingField
        value={thinking}
        disabled={!isManual}
        onChange={(v) => onUpdate({ thinking: v })}
      />
    </>
  );
}

function SamplingSlider({
  label,
  value,
  range,
  disabled,
  onChange
}: {
  label: string;
  value: number;
  range: { min: number; max: number; step: number };
  disabled: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <section className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Text size="xs" variant="secondary">
          {value.toFixed(2)}
        </Text>
      </div>
      <input
        type="range"
        min={range.min}
        max={range.max}
        step={range.step}
        value={value}
        disabled={disabled}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-kumo-brand disabled:opacity-40"
      />
    </section>
  );
}

function SamplingThinkingField({
  value,
  disabled,
  onChange
}: {
  value: boolean | undefined;
  disabled: boolean;
  onChange: (v: boolean) => void;
}) {
  const on = value !== false;
  return (
    <section className="flex items-center justify-between">
      <Label>Thinking</Label>
      <Switch
        checked={on}
        disabled={disabled}
        onCheckedChange={onChange}
        size="sm"
        aria-label="Enable thinking"
      />
    </section>
  );
}

function PresetField({
  value,
  onChange
}: {
  value: Preset;
  onChange: (v: Preset) => void;
}) {
  return (
    <section className="space-y-1.5">
      <Label>Preset</Label>
      <Segmented options={PRESETS} value={value} onChange={onChange} />
    </section>
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
      <InputArea
        value={value ?? ""}
        onValueChange={(v) => onChange(v || undefined)}
        aria-label="System instructions"
        placeholder="Empty system prompt."
        rows={5}
        className="w-full font-mono resize-y"
      />
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
  value: T | undefined;
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

function Label({ children }: { children: React.ReactNode }) {
  return (
    <Text size="xs" bold variant="secondary" as="span">
      {children}
    </Text>
  );
}
