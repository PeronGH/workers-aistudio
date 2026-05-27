import { Button, Select, Text } from "@cloudflare/kumo";
import { Slider } from "@cloudflare/kumo/primitives/slider";
import { XIcon } from "@phosphor-icons/react";
import {
  HEIGHT_RANGE,
  IMAGE_MODELS,
  IMAGE_MODEL_LABELS,
  STEPS_RANGE,
  WIDTH_RANGE,
  type ImageModel,
  type ImageSettings
} from "../../../shared/images";

interface ImageSettingsPanelProps {
  settings: ImageSettings;
  drawerOpen: boolean;
  onCloseDrawer: () => void;
  onUpdate: (patch: Partial<ImageSettings>) => void;
  onReset: () => void;
}

export function ImageSettingsPanel({
  settings,
  drawerOpen,
  onCloseDrawer,
  onUpdate,
  onReset
}: ImageSettingsPanelProps) {
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

          <section className="space-y-5">
            <div className="flex items-center justify-between">
              <Text size="sm" bold>
                Image settings
              </Text>
              <Button variant="ghost" size="sm" onClick={onReset}>
                Reset
              </Button>
            </div>

            <section className="space-y-1.5">
              <Label>Model</Label>
              <Select
                size="sm"
                aria-label="Model"
                value={settings.model}
                onValueChange={(v) =>
                  typeof v === "string" && onUpdate({ model: v as ImageModel })
                }
                className="w-full"
              >
                {IMAGE_MODELS.map((m) => (
                  <Select.Option key={m} value={m}>
                    {IMAGE_MODEL_LABELS[m]}
                  </Select.Option>
                ))}
              </Select>
            </section>

            <SettingSlider
              label="Width"
              value={settings.width}
              range={WIDTH_RANGE}
              onChange={(v) => onUpdate({ width: v })}
            />
            <SettingSlider
              label="Height"
              value={settings.height}
              range={HEIGHT_RANGE}
              onChange={(v) => onUpdate({ height: v })}
            />
            <SettingSlider
              label="Steps"
              value={settings.steps}
              range={STEPS_RANGE}
              onChange={(v) => onUpdate({ steps: v })}
            />
          </section>
        </div>
      </aside>
    </>
  );
}

function SettingSlider({
  label,
  value,
  range,
  onChange
}: {
  label: string;
  value: number;
  range: { min: number; max: number; step: number };
  onChange: (v: number) => void;
}) {
  return (
    <Slider.Root
      value={value}
      min={range.min}
      max={range.max}
      step={range.step}
      onValueChange={onChange}
      className="space-y-1.5"
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

function Label({ children }: { children: React.ReactNode }) {
  return (
    <Text size="xs" bold variant="secondary" as="span">
      {children}
    </Text>
  );
}
