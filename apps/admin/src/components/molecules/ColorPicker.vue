<script setup lang="ts">
import type { ColorMetadata } from '@/composables/options/useOptionsCatalog';
import { formatHex, formatHex8, hsl, hsv, oklch, parse, rgb } from 'culori';
import { computed, ref, watch } from 'vue';

// Picker classique. Contrat = couleur oklch canonique (`ColorMetadata`, SSOT). En interne on
// travaille en HSV (carré saturation/valeur + teinte), converti vers oklch à l'émission via culori.
// Saisie multi-format (hex/rgba/hsl/oklch) + pipette écran (EyeDropper).
const props = defineProps<{ modelValue: ColorMetadata }>();
const emit = defineEmits<{ 'update:modelValue': [value: ColorMetadata] }>();

type Mode = 'hex' | 'rgba' | 'hsl' | 'oklch';
const modes: { value: Mode; label: string }[] = [
  { value: 'hex', label: 'HEX' },
  { value: 'rgba', label: 'RGBA' },
  { value: 'hsl', label: 'HSL' },
  { value: 'oklch', label: 'OKLCH' },
];
const mode = ref<Mode>('hex');

// État interne HSV (source de vérité pendant l'interaction).
const hue = ref(0);
const sat = ref(0);
const val = ref(1);
const alpha = ref(1);

let lastEmitted: ColorMetadata | null = null;

function round(n: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}
function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}
function approxEqual(a: ColorMetadata, b: ColorMetadata): boolean {
  return (
    Math.abs(a.l - b.l) < 1e-3 &&
    Math.abs(a.c - b.c) < 1e-3 &&
    Math.abs(a.h - b.h) < 0.5 &&
    Math.abs(a.alpha - b.alpha) < 1e-2
  );
}

// oklch (modelValue) → HSV interne. Garde la teinte courante si la couleur est grise (h indéfini).
function syncFromModel(m: ColorMetadata) {
  const c = hsv({ mode: 'oklch', l: m.l, c: m.c, h: m.h, alpha: m.alpha });
  if (!c) return;
  if (c.h !== undefined) hue.value = c.h;
  sat.value = c.s ?? 0;
  val.value = c.v ?? 0;
  alpha.value = m.alpha;
}

// HSV interne → oklch canonique, émis au parent.
function emitColor() {
  const c = oklch({ mode: 'hsv', h: hue.value, s: sat.value, v: val.value, alpha: alpha.value });
  if (!c) return;
  const next: ColorMetadata = {
    l: round(c.l, 4),
    c: round(c.c ?? 0, 4),
    h: round(c.h ?? 0, 2),
    alpha: round(alpha.value, 2),
  };
  lastEmitted = next;
  emit('update:modelValue', next);
}

watch(
  () => props.modelValue,
  (m) => {
    // Ignore l'écho de notre propre émission (évite la boucle de feedback).
    if (lastEmitted && approxEqual(m, lastEmitted)) return;
    syncFromModel(m);
  },
  { immediate: true },
);

// --- Rendu ---
const cssColor = computed(
  () => `oklch(${props.modelValue.l} ${props.modelValue.c} ${props.modelValue.h} / ${props.modelValue.alpha})`,
);
const hueCss = computed(() => `hsl(${hue.value} 100% 50%)`);
const opaqueCss = computed(
  () => `oklch(${props.modelValue.l} ${props.modelValue.c} ${props.modelValue.h})`,
);

// Valeur affichée dans le champ, selon le mode.
const formatted = computed(() => {
  const c = { mode: 'oklch' as const, l: props.modelValue.l, c: props.modelValue.c, h: props.modelValue.h, alpha: props.modelValue.alpha };
  const a = props.modelValue.alpha;
  if (mode.value === 'hex') return a < 1 ? (formatHex8(c) ?? '') : (formatHex(c) ?? '');
  if (mode.value === 'rgba') {
    const r = rgb(c);
    if (!r) return '';
    const to255 = (n: number) => Math.round(clamp01(n) * 255);
    return `rgba(${to255(r.r)}, ${to255(r.g)}, ${to255(r.b)}, ${a})`;
  }
  if (mode.value === 'hsl') {
    const h = hsl(c);
    if (!h) return '';
    return `hsl(${round(h.h ?? 0, 0)} ${round((h.s ?? 0) * 100, 0)}% ${round((h.l ?? 0) * 100, 0)}%${a < 1 ? ` / ${a}` : ''})`;
  }
  return `oklch(${props.modelValue.l} ${props.modelValue.c} ${props.modelValue.h}${a < 1 ? ` / ${a}` : ''})`;
});

// Saisie libre (n'importe quel format CSS) → HSV interne → émission.
function applyParsed(raw: string) {
  const parsed = parse(raw.trim());
  const c = parsed ? hsv(parsed) : undefined;
  if (!c || !parsed) return;
  if (c.h !== undefined) hue.value = c.h;
  sat.value = c.s ?? 0;
  val.value = c.v ?? 0;
  alpha.value = parsed.alpha ?? 1;
  emitColor();
}
function onTextChange(event: Event) {
  applyParsed((event.target as HTMLInputElement).value);
}

// --- Carré saturation / valeur (drag) ---
const squareRef = ref<HTMLElement | null>(null);
function updateFromSquare(event: PointerEvent) {
  const el = squareRef.value;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  sat.value = clamp01((event.clientX - rect.left) / rect.width);
  val.value = 1 - clamp01((event.clientY - rect.top) / rect.height);
  emitColor();
}
function onSquareDown(event: PointerEvent) {
  squareRef.value?.setPointerCapture(event.pointerId);
  updateFromSquare(event);
}
function onSquareMove(event: PointerEvent) {
  if (event.buttons !== 1) return;
  updateFromSquare(event);
}

function onHue(event: Event) {
  hue.value = Number((event.target as HTMLInputElement).value);
  emitColor();
}
function onAlpha(event: Event) {
  alpha.value = Number((event.target as HTMLInputElement).value);
  emitColor();
}

// --- Pipette écran (EyeDropper) ---
const canEyedrop = typeof window !== 'undefined' && !!window.EyeDropper;
async function pickFromScreen() {
  if (!window.EyeDropper) return;
  try {
    const { sRGBHex } = await new window.EyeDropper().open();
    applyParsed(sRGBHex);
  } catch {
    // Sélection annulée par l'utilisateur — rien à faire.
  }
}
</script>

<template>
  <div class="space-y-3 w-full max-w-xs">
    <!-- Carré saturation (x) / valeur (y) -->
    <div
      ref="squareRef"
      class="relative w-full h-40 rounded-lg cursor-crosshair touch-none select-none"
      :style="{ backgroundColor: hueCss }"
      @pointerdown="onSquareDown"
      @pointermove="onSquareMove"
    >
      <div
        class="absolute inset-0 rounded-lg"
        style="background: linear-gradient(to right, #fff, transparent)"
      />
      <div
        class="absolute inset-0 rounded-lg"
        style="background: linear-gradient(to top, #000, transparent)"
      />
      <div
        class="absolute w-3.5 h-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow ring-1 ring-black/30 pointer-events-none"
        :style="{ left: `${sat * 100}%`, top: `${(1 - val) * 100}%`, backgroundColor: opaqueCss }"
      />
    </div>

    <!-- Aperçu + teinte + alpha -->
    <div class="flex items-center gap-3">
      <div class="relative w-10 h-10 rounded-lg border border-gray-300 overflow-hidden shrink-0">
        <div class="absolute inset-0 checkerboard" />
        <div
          class="absolute inset-0"
          :style="{ backgroundColor: cssColor }"
        />
      </div>
      <div class="flex-1 space-y-2">
        <input
          class="hue-slider w-full h-3 appearance-none rounded-full cursor-pointer"
          type="range"
          min="0"
          max="360"
          step="1"
          :value="hue"
          aria-label="Teinte"
          @input="onHue"
        />
        <input
          class="w-full h-3 appearance-none rounded-full cursor-pointer alpha-slider"
          type="range"
          min="0"
          max="1"
          step="0.01"
          :value="alpha"
          aria-label="Opacité"
          :style="{ '--stop': opaqueCss }"
          @input="onAlpha"
        />
      </div>
    </div>

    <!-- Mode + champ éditable + pipette -->
    <div class="flex items-center gap-2">
      <select
        v-model="mode"
        class="text-xs border border-gray-300 rounded px-1.5 py-1.5 bg-white cursor-pointer"
        aria-label="Format"
      >
        <option
          v-for="m in modes"
          :key="m.value"
          :value="m.value"
        >
          {{ m.label }}
        </option>
      </select>
      <input
        class="flex-1 min-w-0 px-2 py-1.5 text-xs font-mono border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        type="text"
        :value="formatted"
        spellcheck="false"
        @change="onTextChange"
      />
      <button
        v-if="canEyedrop"
        type="button"
        class="p-1.5 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 cursor-pointer"
        title="Pipette écran"
        @click="pickFromScreen"
      >
        <svg
          class="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="m2 22 1-1h3l9-9" />
          <path d="M3 21v-3l9-9" />
          <path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.4.4a2.1 2.1 0 1 1-3 3l-3.8-3.8a2.1 2.1 0 1 1 3-3l.4.4Z" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.checkerboard {
  background-image: linear-gradient(45deg, #ccc 25%, transparent 25%),
    linear-gradient(-45deg, #ccc 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #ccc 75%),
    linear-gradient(-45deg, transparent 75%, #ccc 75%);
  background-size: 10px 10px;
  background-position: 0 0, 0 5px, 5px -5px, -5px 0;
}
.hue-slider {
  background: linear-gradient(
    to right,
    hsl(0 100% 50%),
    hsl(60 100% 50%),
    hsl(120 100% 50%),
    hsl(180 100% 50%),
    hsl(240 100% 50%),
    hsl(300 100% 50%),
    hsl(360 100% 50%)
  );
}
.alpha-slider {
  background:
    linear-gradient(to right, transparent, var(--stop)),
    repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 0 0 / 10px 10px;
}
.hue-slider::-webkit-slider-thumb,
.alpha-slider::-webkit-slider-thumb {
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 9999px;
  background: #fff;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.4);
  cursor: pointer;
}
.hue-slider::-moz-range-thumb,
.alpha-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 9999px;
  background: #fff;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.4);
  cursor: pointer;
}
</style>
