import { Button, InputArea, Select, Switch, Text } from "@cloudflare/kumo";
import { Slider } from "@cloudflare/kumo/primitives/slider";
import { Toggle } from "@cloudflare/kumo/primitives/toggle";
import { ToggleGroup } from "@cloudflare/kumo/primitives/toggle-group";
import { XIcon } from "@phosphor-icons/react";
import {
  DEFAULT_PRESET,
  PRESETS,
  PRESET_VALUES,
  TEMPERATURE_RANGE,
  TOP_P_RANGE,
  TRANSCRIPTION_LANGUAGES,
  type LocalSettings,
  type Preset,
  type RunSettings
} from "../../shared/settings";
import { useTheme } from "../hooks/useTheme";

interface SettingsPanelProps {
  settings: RunSettings;
  localSettings: LocalSettings;
  drawerOpen: boolean;
  showDebug: boolean;
  canForcePush: boolean;
  onToggleDebug: (next: boolean) => void;
  onForcePush: () => void;
  onCloseDrawer: () => void;
  onUpdate: (patch: Partial<RunSettings>) => void;
  onUpdateLocal: (patch: Partial<LocalSettings>) => void;
  onReset: () => void;
}

export function SettingsPanel({
  settings,
  localSettings,
  drawerOpen,
  showDebug,
  canForcePush,
  onToggleDebug,
  onForcePush,
  onCloseDrawer,
  onUpdate,
  onUpdateLocal,
  onReset
}: SettingsPanelProps) {
  const { dark, toggle: toggleTheme } = useTheme();
  return (
    <>
      {drawerOpen && (
        <Button
          variant="ghost"
          aria-label="Close settings"
          onClick={onCloseDrawer}
          className="md:hidden fixed inset-0 h-auto w-auto rounded-none bg-black/40 p-0 shadow-none backdrop-blur-sm hover:bg-black/40 focus-visible:ring-0"
        />
      )}
      <aside
        className={`${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        } md:translate-x-0 fixed md:static inset-y-0 right-0 w-[340px] shrink-0 border-l border-kumo-line bg-kumo-base overflow-y-auto transition-transform`}
      >
        <div className="p-4 space-y-6">
          <div className="flex md:hidden items-center justify-end">
            <Button
              variant="ghost"
              shape="square"
              size="sm"
              aria-label="Close settings"
              icon={<XIcon size={16} />}
              onClick={onCloseDrawer}
            />
          </div>

          <section className="space-y-4">
            <Text size="sm" bold>
              General
            </Text>
            <TranscriptionLanguageField
              value={localSettings.transcriptionLanguage}
              onChange={(v) => onUpdateLocal({ transcriptionLanguage: v })}
            />
            <ToggleRow
              label="Dark mode"
              checked={dark}
              onCheckedChange={toggleTheme}
              ariaLabel="Toggle dark mode"
            />
            <ToggleRow
              label="Debug mode"
              checked={showDebug}
              onCheckedChange={onToggleDebug}
              ariaLabel="Toggle debug mode"
            />
            <section className="flex items-center justify-between">
              <Label>Force push</Label>
              <Button
                variant="secondary"
                size="sm"
                disabled={!canForcePush}
                onClick={onForcePush}
              >
                Push now
              </Button>
            </section>
          </section>

          <section className="space-y-5">
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
          </section>
        </div>
      </aside>
    </>
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
    <Slider.Root
      value={value}
      min={range.min}
      max={range.max}
      step={range.step}
      disabled={disabled}
      format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
      onValueChange={onChange}
      className={`space-y-1.5 ${disabled ? "opacity-40" : ""}`}
    >
      <div className="flex items-center justify-between">
        <Slider.Label className="text-xs font-semibold text-kumo-subtle">
          {label}
        </Slider.Label>
        <Slider.Value className="text-xs text-kumo-subtle tabular-nums">
          {([formatted]) => formatted}
        </Slider.Value>
      </div>
      <Slider.Control className="relative flex h-5 w-full items-center py-2">
        <Slider.Track className="h-1.5 w-full rounded-full bg-kumo-control">
          <Slider.Indicator className="rounded-full bg-kumo-brand" />
          <Slider.Thumb
            className="h-3.5 w-3.5 rounded-full border border-kumo-line bg-kumo-base shadow-sm outline-none ring-0 transition-shadow focus-visible:ring-2 focus-visible:ring-kumo-focus/50"
            getAriaLabel={() => label}
          />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
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
    <ToggleGroup
      value={value ? [value] : []}
      disabled={disabled}
      onValueChange={(next) => {
        const selected = next[0];
        if (selected) onChange(selected as T);
      }}
      className="inline-flex w-full rounded-lg border border-kumo-line overflow-hidden"
    >
      {options.map((opt) => (
        <Toggle
          key={opt}
          value={opt}
          disabled={disabled}
          className={`flex-1 px-2 py-1 text-xs font-medium transition-colors ${
            value === opt
              ? "bg-kumo-contrast text-kumo-inverse"
              : "bg-kumo-base text-kumo-default hover:bg-kumo-control"
          } disabled:cursor-not-allowed`}
        >
          {opt}
        </Toggle>
      ))}
    </ToggleGroup>
  );
}

function TranscriptionLanguageField({
  value,
  onChange
}: {
  value: string | undefined;
  onChange: (v: string | undefined) => void;
}) {
  return (
    <section className="space-y-1.5">
      <Label>Transcription language</Label>
      <Select
        size="sm"
        aria-label="Transcription language"
        value={value ?? "auto"}
        onValueChange={(v) =>
          onChange(typeof v === "string" && v !== "auto" ? v : undefined)
        }
        className="w-full"
      >
        <Select.Option value="auto">Auto</Select.Option>
        {TRANSCRIPTION_LANGUAGES.map((l) => (
          <Select.Option key={l.code} value={l.code}>
            {l.name}
          </Select.Option>
        ))}
      </Select>
    </section>
  );
}

function ToggleRow({
  label,
  checked,
  onCheckedChange,
  ariaLabel
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  ariaLabel: string;
}) {
  return (
    <section className="flex items-center justify-between">
      <Label>{label}</Label>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        size="sm"
        aria-label={ariaLabel}
      />
    </section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <Text size="xs" bold variant="secondary" as="span">
      {children}
    </Text>
  );
}
