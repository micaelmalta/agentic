<template>
  <div class="dropdown-modal" ref="triggerRef">
    <div class="select-label" v-if="label">{{ label }}</div>
    <button
      type="button"
      class="dropdown-trigger"
      :class="{ open: isOpen, disabled }"
      :disabled="disabled"
      :data-testid="testId ?? undefined"
      aria-haspopup="listbox"
      :aria-expanded="isOpen"
      aria-label="Select option"
      @click="toggle"
    >
      <span class="trigger-label">{{ displayLabel }}</span>
      <ChevronDown :size="14" class="chevron" />
      <slot name="suffix" />
    </button>
    <Teleport to="body">
      <Transition name="dropdown">
        <div v-if="isOpen" class="dropdown-transition-root">
          <div
            class="dropdown-overlay"
            @click="close"
          />
          <div
            ref="panelRef"
            class="dropdown-panel"
            :style="panelStyle"
            role="listbox"
            tabindex="-1"
            @click.stop
            @keydown="onPanelKeydown"
          >
            <div v-if="searchable" class="dropdown-search-wrap">
              <input
                ref="searchInputRef"
                v-model="searchQuery"
                type="text"
                class="dropdown-search"
                placeholder="Search..."
                @keydown.stop
              />
            </div>
            <div ref="listRef" class="dropdown-list" role="listbox">
              <template v-if="filteredOptions.length">
                <button
                  v-for="(opt, index) in filteredOptions"
                  :key="String(opt.value)"
                  type="button"
                  class="dropdown-option"
                  :class="{ selected: isSelected(opt.value) }"
                  :ref="(el) => setOptionRef(el as HTMLElement, index)"
                  role="option"
                  :aria-selected="isSelected(opt.value)"
                  @click="select(opt)"
                >
                  {{ opt.label }}
                </button>
              </template>
              <div v-else class="dropdown-empty">No options</div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { ChevronDown } from 'lucide-vue-next'

export interface DropdownOption {
  value: string | number
  label: string
}

const props = withDefaults(
  defineProps<{
    modelValue: string | number
    options: DropdownOption[]
    label?: string
    placeholder?: string
    searchable?: boolean
    disabled?: boolean
    testId?: string
  }>(),
  { placeholder: '—', searchable: false, disabled: false }
)

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const triggerRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const listRef = ref<HTMLElement | null>(null)
const searchInputRef = ref<HTMLInputElement | null>(null)
const isOpen = ref(false)
const searchQuery = ref('')
const panelStyle = ref<Record<string, string>>({})
const optionRefs = ref<HTMLElement[]>([])

function setOptionRef(el: HTMLElement | null, index: number) {
  if (el) optionRefs.value[index] = el
}

const displayLabel = computed(() => {
  if (props.modelValue === '' || props.modelValue === undefined) return props.placeholder
  const opt = props.options.find((o) => String(o.value) === String(props.modelValue))
  return opt ? opt.label : props.placeholder
})

const filteredOptions = computed(() => {
  if (!props.searchable || !searchQuery.value.trim()) return props.options
  const q = searchQuery.value.trim().toLowerCase()
  return props.options.filter((o) => (o.label || String(o.value)).toLowerCase().includes(q))
})

function isSelected(value: string | number) {
  return String(value) === String(props.modelValue)
}

function toggle() {
  if (props.disabled) return
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    searchQuery.value = ''
    nextTick(() => {
      updatePosition()
      if (props.searchable) searchInputRef.value?.focus()
      else panelRef.value?.focus()
    })
  }
}

function close() {
  isOpen.value = false
}

function select(opt: DropdownOption) {
  emit('update:modelValue', opt.value)
  close()
}

function updatePosition() {
  if (!triggerRef.value || !panelRef.value) return
  const rect = triggerRef.value.getBoundingClientRect()
  const padding = 8
  const maxHeight = 320
  const spaceBelow = window.innerHeight - rect.bottom
  const openBelow = spaceBelow >= maxHeight + padding || spaceBelow >= rect.top
  if (openBelow) {
    panelStyle.value = {
      top: `${rect.bottom + padding}px`,
      left: `${rect.left}px`,
      width: `${Math.max(rect.width, 200)}px`,
      maxHeight: `${maxHeight}px`,
    }
  } else {
    panelStyle.value = {
      top: 'auto',
      bottom: `${window.innerHeight - rect.top + padding}px`,
      left: `${rect.left}px`,
      width: `${Math.max(rect.width, 200)}px`,
      maxHeight: `${maxHeight}px`,
    }
  }
}

function onPanelKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    close()
    triggerRef.value?.focus()
    return
  }
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault()
    const list = filteredOptions.value
    if (!list.length) return
    const current = list.findIndex((o) => isSelected(o.value))
    let next = e.key === 'ArrowDown' ? current + 1 : current - 1
    if (next < 0) next = list.length - 1
    if (next >= list.length) next = 0
    emit('update:modelValue', list[next].value)
    nextTick(() => optionRefs.value[next]?.scrollIntoView({ block: 'nearest' }))
  }
  if (e.key === 'Enter') {
    e.preventDefault()
    close()
  }
}

function onDocumentClick(e: MouseEvent) {
  if (isOpen.value && triggerRef.value && panelRef.value && !triggerRef.value.contains(e.target as Node) && !panelRef.value.contains(e.target as Node)) {
    close()
  }
}

watch(isOpen, (open) => {
  if (open) {
    nextTick(updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    document.addEventListener('click', onDocumentClick, true)
  } else {
    window.removeEventListener('scroll', updatePosition, true)
    window.removeEventListener('resize', updatePosition)
    document.removeEventListener('click', onDocumentClick, true)
  }
})

onMounted(() => {
  optionRefs.value = []
})

onUnmounted(() => {
  window.removeEventListener('scroll', updatePosition, true)
  window.removeEventListener('resize', updatePosition)
  document.removeEventListener('click', onDocumentClick, true)
})
</script>

<style scoped>
.dropdown-modal {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.select-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
}

.dropdown-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  padding: 6px 8px 6px 10px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg-elevated);
  color: var(--text-primary);
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.dropdown-trigger:hover:not(.disabled) {
  border-color: var(--text-muted);
  background: var(--bg-hover);
}
.dropdown-trigger.open {
  border-color: var(--accent);
  box-shadow: 0 0 0 1px var(--accent);
}
.dropdown-trigger.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.trigger-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.chevron {
  flex-shrink: 0;
  color: var(--text-muted);
  transition: transform 0.2s;
}
.dropdown-trigger.open .chevron {
  transform: rotate(180deg);
  color: var(--accent);
}

.dropdown-transition-root {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9998;
}
.dropdown-transition-root .dropdown-overlay,
.dropdown-transition-root .dropdown-panel {
  pointer-events: auto;
}

.dropdown-overlay {
  position: fixed;
  inset: 0;
  z-index: 9998;
  background: transparent;
}

.dropdown-panel {
  position: fixed;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  box-shadow: 0 8px 24px var(--shadow-dropdown);
  overflow: hidden;
}

.dropdown-search-wrap {
  flex-shrink: 0;
  padding: 8px;
  border-bottom: 1px solid var(--border-subtle);
}
.dropdown-search {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
}
.dropdown-search::placeholder {
  color: var(--text-muted);
}
.dropdown-search:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 1px var(--accent);
}

.dropdown-list {
  overflow-y: auto;
  padding: 4px;
  max-height: 280px;
}

.dropdown-option {
  display: block;
  width: 100%;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  background: none;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  transition: background 0.1s;
}
.dropdown-option:hover {
  background: var(--bg-hover);
}
.dropdown-option.selected {
  background: var(--accent-dim);
  color: var(--accent);
  font-weight: 500;
}

.dropdown-empty {
  padding: 16px;
  color: var(--text-muted);
  font-size: 13px;
  text-align: center;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
