<template>
  <div
    data-testid="toast-container"
    class="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none"
  >
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :data-testid="`toast-${toast.type}`"
        class="toast pointer-events-auto"
        :class="toastClass(toast.type)"
      >
        <div class="flex items-center gap-2">
          <component :is="toastIcon(toast.type)" :size="16" />
          <span class="text-sm">{{ toast.message }}</span>
        </div>
        <button
          @click="removeToast(toast.id)"
          class="ml-4 hover:opacity-70 transition-opacity"
        >
          <X :size="16" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-vue-next'
import { useToast } from '../../composables/useToast'
import type { Toast } from '../../composables/useToast'

const { toasts, removeToast } = useToast()

function toastIcon(type: Toast['type']) {
  switch (type) {
    case 'success':
      return CheckCircle
    case 'error':
      return AlertCircle
    case 'warning':
      return AlertTriangle
    case 'info':
      return Info
  }
}

function toastClass(type: Toast['type']) {
  switch (type) {
    case 'success':
      return 'toast-success'
    case 'error':
      return 'toast-error'
    case 'warning':
      return 'toast-warning'
    case 'info':
      return 'toast-info'
  }
}
</script>

<style scoped>
.toast {
  @apply flex items-center justify-between;
  @apply min-w-[320px] max-w-[480px];
  @apply px-4 py-3 rounded-lg;
  @apply bg-background-elevated border;
  @apply shadow-lg;
}

.toast-success {
  @apply border-l-4 border-l-status-running text-status-running border-border-primary;
}

.toast-error {
  @apply border-l-4 border-l-danger text-danger border-border-primary;
}

.toast-warning {
  @apply border-l-4 border-l-warning text-warning border-border-primary;
}

.toast-info {
  @apply border-l-4 border-l-accent text-accent border-border-primary;
}

/* Toast transition animations */
.toast-enter-active {
  animation: toast-in 0.2s ease-out;
}

.toast-leave-active {
  animation: toast-out 0.2s ease-in;
}

@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes toast-out {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(20px);
  }
}
</style>
