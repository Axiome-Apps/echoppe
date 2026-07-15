<script setup lang="ts">
import { formatHex, inGamut, oklch, parse } from 'culori';
import { computed } from 'vue';

// Couleur oklch canonique (identique à ColorMetadata côté API). Le picker édite EN oklch ;
// l'entrée peut venir de n'importe quel format CSS (hex/rgb/oklch…) converti via culori.
interface OklchColor {
  l: number;
  c: number;
  h: number;
  alpha: number;
}

const props = defineProps<{ modelValue: OklchColor }>();
const emit = defineEmits<{ 'update:modelValue': [value: OklchColor] }>();

const inRgb = inGamut('rgb');

function round(n: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

// Chroma max AFFICHABLE (sRGB) pour L·H courants — la frontière de gamut dépend de L et H
// (cf. oklch.com). Recherche dichotomique sur `inGamut`. C'est ici que vit la contrainte,
// pas dans un max fixe.
function maxChroma(l: number, h: number): number {
  let lo = 0;
  let hi = 0.4;
  for (let i = 0; i < 18; i++) {
    const mid = (lo + hi) / 2;
    if (inRgb({ mode: 'oklch', l, c: mid, h })) lo = mid;
    else hi = mid;
  }
  return round(lo, 4);
}

const maxC = computed(() => maxChroma(props.modelValue.l, props.modelValue.h));

// Rendu direct : le navigateur gamut-mappe oklch hors gamut → filet de sécurité.
const cssColor = computed(() => {
  const { l, c, h, alpha } = props.modelValue;
  return `oklch(${l} ${c} ${h} / ${alpha})`;
});

const hex = computed(() => formatHex({ mode: 'oklch', ...props.modelValue }) ?? '#000000');

function commit(patch: Partial<OklchColor>) {
  const next = { ...props.modelValue, ...patch };
  // Clamp la chroma au gamut courant (si L ou H a bougé, le max a pu baisser).
  const max = maxChroma(next.l, next.h);
  if (next.c > max) next.c = max;
  emit('update:modelValue', {
    l: round(next.l, 4),
    c: round(next.c, 4),
    h: round(next.h, 2),
    alpha: round(next.alpha, 2),
  });
}

function onRange(key: keyof OklchColor, event: Event) {
  commit({ [key]: Number((event.target as HTMLInputElement).value) });
}

// Colle n'importe quelle couleur CSS (hex, rgb(), hsl(), oklch()…) → convertie en oklch.
function onPaste(event: Event) {
  const input = event.target as HTMLInputElement;
  const raw = input.value.trim();
  if (!raw) return;
  const converted = oklch(parse(raw));
  if (!converted) return;
  commit({
    l: converted.l ?? 0,
    c: converted.c ?? 0,
    h: converted.h ?? 0,
    alpha: converted.alpha ?? 1,
  });
  input.value = '';
}

const rangeClass =
  'flex-1 h-2 appearance-none rounded-full bg-gray-200 cursor-pointer accent-blue-600';
</script>

<template>
  <div class="space-y-3">
    <!-- Aperçu + hex + collage -->
    <div class="flex items-center gap-3">
      <div
        class="w-14 h-14 rounded-lg border border-gray-300 shrink-0"
        :style="{
          backgroundColor: cssColor,
          backgroundImage:
            'linear-gradient(45deg,#ccc 25%,transparent 25%),linear-gradient(-45deg,#ccc 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ccc 75%),linear-gradient(-45deg,transparent 75%,#ccc 75%)',
          backgroundSize: '10px 10px',
          backgroundPosition: '0 0,0 5px,5px -5px,-5px 0',
        }"
      >
        <div
          class="w-full h-full rounded-lg"
          :style="{ backgroundColor: cssColor }"
        />
      </div>
      <div class="flex-1 min-w-0">
        <input
          type="text"
          :placeholder="`Coller une couleur — ${hex}, rgb(), oklch()…`"
          class="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          @change="onPaste"
        />
        <p class="mt-1 text-xs text-gray-400 font-mono">
          {{ hex }} · oklch({{ modelValue.l }} {{ modelValue.c }} {{ modelValue.h }})
        </p>
      </div>
    </div>

    <!-- Sliders L·C·H·alpha (chroma à max adaptatif) -->
    <div class="space-y-2">
      <div class="flex items-center gap-3">
        <span class="w-16 text-xs text-gray-500">Clarté</span>
        <input
          :class="rangeClass"
          type="range"
          min="0"
          max="1"
          step="0.001"
          :value="modelValue.l"
          @input="onRange('l', $event)"
        />
        <span class="w-14 text-right text-xs font-mono text-gray-600">{{ modelValue.l }}</span>
      </div>
      <div class="flex items-center gap-3">
        <span class="w-16 text-xs text-gray-500">Chroma</span>
        <input
          :class="rangeClass"
          type="range"
          min="0"
          :max="maxC"
          step="0.001"
          :value="modelValue.c"
          @input="onRange('c', $event)"
        />
        <span class="w-14 text-right text-xs font-mono text-gray-600">{{ modelValue.c }}</span>
      </div>
      <div class="flex items-center gap-3">
        <span class="w-16 text-xs text-gray-500">Teinte</span>
        <input
          :class="rangeClass"
          type="range"
          min="0"
          max="360"
          step="1"
          :value="modelValue.h"
          @input="onRange('h', $event)"
        />
        <span class="w-14 text-right text-xs font-mono text-gray-600">{{ modelValue.h }}</span>
      </div>
      <div class="flex items-center gap-3">
        <span class="w-16 text-xs text-gray-500">Opacité</span>
        <input
          :class="rangeClass"
          type="range"
          min="0"
          max="1"
          step="0.01"
          :value="modelValue.alpha"
          @input="onRange('alpha', $event)"
        />
        <span class="w-14 text-right text-xs font-mono text-gray-600">{{ modelValue.alpha }}</span>
      </div>
    </div>
  </div>
</template>
