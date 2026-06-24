import {
  Button,
  Input,
  InputArea,
  Select,
  Switch,
  Text
} from "@cloudflare/kumo";
import { Slider } from "@cloudflare/kumo/primitives/slider";
import { Toggle } from "@cloudflare/kumo/primitives/toggle";
import { ToggleGroup } from "@cloudflare/kumo/primitives/toggle-group";
import { XIcon } from "@phosphor-icons/react";
import {
  DEFAULT_MAX_TOKENS,
  DEFAULT_MODEL,
  DEFAULT_PRESET,
  MAX_TOKENS_RANGE,
  MODELS,
  PRESETS,
  PRESET_VALUES,
  TEMPERATURE_RANGE,
  TOP_P_RANGE,
  TRANSCRIPTION_LANGUAGES,
  type LocalSettings,
  type ModelId,
  type Preset,
  type RunSettings
} from "../../shared/settings";
import { PROMPT_TEMPLATES } from "../../shared/templates";
import { useTheme } from "../hooks/useTheme";

interface SettingsPanelProps {
  settings: RunSettings;
  localSettings?: LocalSettings;
  drawerOpen: boolean;
  onCloseDrawer: () => void;
  onUpdate: (patch: Partial<RunSettings>) => void;
  onUpdateLocal?: (patch: Partial<LocalSettings>) => void;
  onReset: () => void;
  showDebug?: boolean;
  onToggleDebug?: (v: boolean) => void;
  canSave?: boolean;
  onSave?: () => void;
  showSystemPrompt?: boolean;
  showThinking?: boolean;
  showCompletionSettings?: boolean;
  onApplyTemplate?: (text: string) => void;
}

export function SettingsPanel({
  settings,
  localSettings,
  drawerOpen,
  onCloseDrawer,
  onUpdate,
  onUpdateLocal,
  onReset,
  showDebug,
  onToggleDebug,
  canSave,
  onSave,
  showSystemPrompt,
  showThinking,
  showCompletionSettings,
  onApplyTemplate
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
            {localSettings && onUpdateLocal && (
              <TranscriptionLanguageField
                value={localSettings.transcriptionLanguage}
                onChange={(v) => onUpdateLocal({ transcriptionLanguage: v })}
              />
            )}
            <ToggleRow
              label="Dark mode"
              checked={dark}
              onCheckedChange={toggleTheme}
              ariaLabel="Toggle dark mode"
            />
            {onToggleDebug && (
              <ToggleRow
                label="Debug mode"
                checked={showDebug ?? false}
                onCheckedChange={onToggleDebug}
                ariaLabel="Toggle debug mode"
              />
            )}
            {onSave && (
              <section className="flex items-center justify-between">
                <Label>Manual save</Label>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!canSave}
                  onClick={onSave}
                >
                  Save
                </Button>
              </section>
            )}
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

            <ModelField
              value={settings.model}
              onChange={(v) => onUpdate({ model: v })}
            />

            {showSystemPrompt && (
              <SystemPromptField
                value={settings.systemPrompt}
                onChange={(v) => onUpdate({ systemPrompt: v })}
              />
            )}

            <SamplingFields
              settings={settings}
              onUpdate={onUpdate}
              showThinking={showThinking}
            />

            {showCompletionSettings && (
              <>
                <MaxTokensField
                  value={settings.maxTokens}
                  onChange={(v) => onUpdate({ maxTokens: v })}
                />
                <StopSequencesField
                  value={settings.stop}
                  onChange={(v) => onUpdate({ stop: v })}
                />
              </>
            )}
          </section>

          {onApplyTemplate && (
            <section className="space-y-3">
              <Text size="sm" bold>
                Templates
              </Text>
              {PROMPT_TEMPLATES.map((t) => (
                <Button
                  key={t.id}
                  variant="secondary"
                  size="sm"
                  onClick={() => onApplyTemplate(t.build())}
                  className="w-full justify-start"
                >
                  {t.label}
                </Button>
              ))}
            </section>
          )}
        </div>
      </aside>
    </>
  );
}

function SamplingFields({
  settings,
  onUpdate,
  showThinking
}: {
  settings: RunSettings;
  onUpdate: (patch: Partial<RunSettings>) => void;
  showThinking?: boolean;
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
      {showThinking && (
        <SamplingThinkingField
          value={thinking}
          disabled={!isManual}
          onChange={(v) => onUpdate({ thinking: v })}
        />
      )}
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

function ModelField({
  value,
  onChange
}: {
  value: ModelId | undefined;
  onChange: (v: ModelId) => void;
}) {
  return (
    <section className="space-y-1.5">
      <Label>Model</Label>
      <Select
        size="sm"
        aria-label="Model"
        value={value ?? DEFAULT_MODEL}
        onValueChange={(v) => {
          if (typeof v === "string") onChange(v as ModelId);
        }}
        className="w-full"
      >
        {MODELS.map((m) => (
          <Select.Option key={m.id} value={m.id}>
            {m.label}
          </Select.Option>
        ))}
      </Select>
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

function MaxTokensField({
  value,
  onChange
}: {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <section className="space-y-1.5">
      <Label>Max tokens</Label>
      <Input
        type="number"
        size="sm"
        aria-label="Max tokens"
        min={MAX_TOKENS_RANGE.min}
        max={MAX_TOKENS_RANGE.max}
        value={value ?? DEFAULT_MAX_TOKENS}
        onValueChange={(v) => {
          const n = Number(v);
          onChange(Number.isFinite(n) && n > 0 ? n : undefined);
        }}
        className="w-full tabular-nums"
      />
    </section>
  );
}

function StopSequencesField({
  value,
  onChange
}: {
  value: string[] | undefined;
  onChange: (v: string[] | undefined) => void;
}) {
  return (
    <section className="space-y-1.5">
      <Label>Stop sequences</Label>
      <InputArea
        size="sm"
        aria-label="Stop sequences"
        placeholder="One per line"
        rows={3}
        value={value?.join("\n") ?? ""}
        onValueChange={(v) => {
          const seqs = v.split("\n").filter(Boolean);
          onChange(seqs.length > 0 ? seqs : undefined);
        }}
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
