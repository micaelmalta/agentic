import { ref } from 'vue'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration?: number
}

const toasts = ref<Toast[]>([])

export function useToast() {
  function addToast(message: string, type: Toast['type'] = 'info', duration = 3000) {
    const id = crypto.randomUUID()
    const toast: Toast = { id, message, type, duration }

    toasts.value.push(toast)

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }

    return id
  }

  function removeToast(id: string) {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index !== -1) {
      toasts.value.splice(index, 1)
    }
  }

  function success(message: string, duration?: number) {
    return addToast(message, 'success', duration)
  }

  function error(message: string, duration?: number) {
    return addToast(message, 'error', duration)
  }

  function info(message: string, duration?: number) {
    return addToast(message, 'info', duration)
  }

  function warning(message: string, duration?: number) {
    return addToast(message, 'warning', duration)
  }

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    info,
    warning
  }
}
