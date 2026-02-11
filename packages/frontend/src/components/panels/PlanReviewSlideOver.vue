<template>
  <Teleport to="body">
    <Transition name="slide">
      <div
        v-if="isOpen && selectedPlan"
        class="slide-over-overlay"
        @click.self="closeSlideOver"
      >
        <div class="slide-over-panel">
          <!-- Header -->
          <div class="slide-over-header">
            <div>
              <h2 class="text-lg font-semibold text-text-primary">Plan Review</h2>
              <p class="text-sm text-text-secondary mt-1">
                Agent {{ selectedPlan.agentId }}
              </p>
            </div>
            <button
              @click="closeSlideOver"
              class="close-btn"
              title="Close (Esc)"
            >
              <X :size="20" />
            </button>
          </div>

          <!-- Content -->
          <div class="slide-over-content">
            <!-- Issue Context -->
            <section v-if="selectedPlan.issueContext" class="plan-section">
              <h3 class="section-title">Issue Context</h3>
              <div class="section-content">
                <div class="issue-key">{{ selectedPlan.issueContext.key }}</div>
                <h4 class="issue-summary">{{ selectedPlan.issueContext.summary }}</h4>
                <p v-if="selectedPlan.issueContext.description" class="issue-description">
                  {{ selectedPlan.issueContext.description }}
                </p>
                <div v-if="selectedPlan.issueContext.acceptanceCriteria" class="acceptance-criteria">
                  <strong>Acceptance Criteria:</strong>
                  <p>{{ selectedPlan.issueContext.acceptanceCriteria }}</p>
                </div>
              </div>
            </section>

            <!-- Plan -->
            <section class="plan-section">
              <h3 class="section-title">Implementation Plan</h3>
              <div class="section-content markdown-content" v-html="renderedPlan"></div>
            </section>

            <!-- Risk Assessment -->
            <section v-if="selectedPlan.riskAssessment" class="plan-section">
              <h3 class="section-title">Risk Assessment</h3>
              <div class="section-content risk-content">
                {{ selectedPlan.riskAssessment }}
              </div>
            </section>

            <!-- Estimated Scope -->
            <section v-if="selectedPlan.scope" class="plan-section">
              <h3 class="section-title">Estimated Scope</h3>
              <div class="section-content">
                <div v-if="selectedPlan.scope.filesToChange.length > 0" class="scope-item">
                  <strong>Files to change ({{ selectedPlan.scope.filesToChange.length }}):</strong>
                  <ul class="file-list">
                    <li v-for="file in selectedPlan.scope.filesToChange" :key="file">
                      <FileCode :size="14" class="inline" /> {{ file }}
                    </li>
                  </ul>
                </div>
                <div v-if="selectedPlan.scope.newFiles.length > 0" class="scope-item">
                  <strong>New files ({{ selectedPlan.scope.newFiles.length }}):</strong>
                  <ul class="file-list">
                    <li v-for="file in selectedPlan.scope.newFiles" :key="file">
                      <FilePlus :size="14" class="inline" /> {{ file }}
                    </li>
                  </ul>
                </div>
                <div v-if="selectedPlan.scope.testCoveragePlan" class="scope-item">
                  <strong>Test Coverage Plan:</strong>
                  <p>{{ selectedPlan.scope.testCoveragePlan }}</p>
                </div>
              </div>
            </section>

            <!-- Feedback Input (for approve with comments or request changes) -->
            <section v-if="showFeedbackInput" class="plan-section">
              <h3 class="section-title">{{ feedbackTitle }}</h3>
              <div class="section-content">
                <textarea
                  v-model="feedbackText"
                  :placeholder="feedbackPlaceholder"
                  class="feedback-input"
                  rows="4"
                ></textarea>
              </div>
            </section>
          </div>

          <!-- Actions -->
          <div class="slide-over-actions">
            <template v-if="!showFeedbackInput">
              <button
                @click="handleApprove"
                class="action-btn action-primary"
                data-testid="approve-btn"
              >
                <Check :size="16" />
                Approve
              </button>
              <button
                @click="showFeedback('approve-with-comments')"
                class="action-btn action-secondary"
                data-testid="approve-with-comments-btn"
              >
                <MessageSquare :size="16" />
                Approve with Comments
              </button>
              <button
                @click="showFeedback('request-changes')"
                class="action-btn action-secondary"
                data-testid="request-changes-btn"
              >
                <Edit :size="16" />
                Request Changes
              </button>
              <button
                @click="handleReject"
                class="action-btn action-danger"
                data-testid="reject-btn"
              >
                <XCircle :size="16" />
                Reject
              </button>
              <button
                @click="handleReassign"
                class="action-btn action-secondary"
                data-testid="reassign-btn"
              >
                <Users :size="16" />
                Reassign
              </button>
            </template>
            <template v-else>
              <button
                @click="submitFeedback"
                class="action-btn action-primary"
                :disabled="!feedbackText.trim()"
              >
                Submit
              </button>
              <button
                @click="cancelFeedback"
                class="action-btn action-secondary"
              >
                Cancel
              </button>
            </template>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { X, Check, XCircle, MessageSquare, Edit, Users, FileCode, FilePlus } from 'lucide-vue-next'
import { usePlansStore } from '../../stores/plans'
import { useAgentsStore } from '../../stores/agents'
import { marked } from 'marked'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const plansStore = usePlansStore()
const agentsStore = useAgentsStore()

const showFeedbackInput = ref(false)
const feedbackAction = ref<'approve-with-comments' | 'request-changes' | null>(null)
const feedbackText = ref('')

const selectedPlan = computed(() => {
  if (!plansStore.selectedPlanId) return null
  return plansStore.plans.find(p => p.id === plansStore.selectedPlanId) || null
})

const renderedPlan = computed(() => {
  if (!selectedPlan.value) return ''
  try {
    return marked(selectedPlan.value.planContent)
  } catch (error) {
    console.error('Failed to render markdown:', error)
    return selectedPlan.value.planContent
  }
})

const feedbackTitle = computed(() => {
  if (feedbackAction.value === 'approve-with-comments') {
    return 'Additional Comments'
  }
  if (feedbackAction.value === 'request-changes') {
    return 'Requested Changes'
  }
  return 'Feedback'
})

const feedbackPlaceholder = computed(() => {
  if (feedbackAction.value === 'approve-with-comments') {
    return 'Add any additional comments or suggestions...'
  }
  if (feedbackAction.value === 'request-changes') {
    return 'Describe what needs to be changed in the plan...'
  }
  return 'Enter your feedback...'
})

function closeSlideOver() {
  plansStore.selectPlan(null)
  emit('close')
}

function showFeedback(action: 'approve-with-comments' | 'request-changes') {
  feedbackAction.value = action
  showFeedbackInput.value = true
  feedbackText.value = ''
}

function cancelFeedback() {
  showFeedbackInput.value = false
  feedbackAction.value = null
  feedbackText.value = ''
}

async function submitFeedback() {
  if (!selectedPlan.value || !feedbackText.value.trim()) return

  if (feedbackAction.value === 'approve-with-comments') {
    await plansStore.approvePlan(selectedPlan.value.id, feedbackText.value)
  } else if (feedbackAction.value === 'request-changes') {
    await plansStore.requestChanges(selectedPlan.value.id, feedbackText.value)
  }

  cancelFeedback()
  closeSlideOver()
}

async function handleApprove() {
  if (!selectedPlan.value) return
  await plansStore.approvePlan(selectedPlan.value.id)
  closeSlideOver()
}

async function handleReject() {
  if (!selectedPlan.value) return
  const confirmed = confirm('Are you sure you want to reject this plan? The agent will stop and the issue will return to unassigned.')
  if (confirmed) {
    await plansStore.rejectPlan(selectedPlan.value.id)
    closeSlideOver()
  }
}

async function handleReassign() {
  if (!selectedPlan.value) return

  // Get available agents
  const availableAgents = agentsStore.agents.filter(a => a.id !== selectedPlan.value?.agentId)

  if (availableAgents.length === 0) {
    alert('No other agents available for reassignment.')
    return
  }

  // Simple prompt for now (could be a modal in the future)
  const agentList = availableAgents.map((a, i) => `${i + 1}. ${a.id}`).join('\n')
  const choice = prompt(`Select agent to reassign to:\n\n${agentList}\n\nEnter agent number:`)

  if (choice) {
    const index = parseInt(choice) - 1
    if (index >= 0 && index < availableAgents.length) {
      await plansStore.reassignPlan(selectedPlan.value.id, availableAgents[index].id)
      closeSlideOver()
    } else {
      alert('Invalid selection')
    }
  }
}

// Keyboard shortcut: Escape to close
watch(() => props.isOpen, (open) => {
  if (open) {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !showFeedbackInput.value) {
        closeSlideOver()
      } else if (e.key === 'Escape' && showFeedbackInput.value) {
        cancelFeedback()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }
})
</script>

<style scoped>
.slide-over-overlay {
  @apply fixed inset-0 z-50;
  @apply bg-black bg-opacity-50;
  @apply flex items-stretch justify-end;
}

.slide-over-panel {
  @apply w-[560px] bg-background-secondary;
  @apply flex flex-col;
  @apply shadow-2xl;
  @apply border-l border-border-primary;
}

.slide-over-header {
  @apply flex items-start justify-between;
  @apply px-6 py-4;
  @apply border-b border-border-primary;
  @apply flex-shrink-0;
}

.close-btn {
  @apply p-2 rounded-lg;
  @apply text-text-secondary hover:text-text-primary hover:bg-background-elevated;
  @apply transition-colors;
}

.slide-over-content {
  @apply flex-1 overflow-y-auto;
  @apply px-6 py-4;
  @apply space-y-6;
}

.plan-section {
  @apply space-y-3;
}

.section-title {
  @apply text-sm font-semibold text-text-primary;
  @apply border-b border-border-primary pb-2;
}

.section-content {
  @apply text-sm text-text-primary;
}

.issue-key {
  @apply inline-block px-2 py-1 rounded;
  @apply bg-background-elevated text-text-accent font-mono text-xs;
  @apply mb-2;
}

.issue-summary {
  @apply text-base font-medium text-text-primary mb-2;
}

.issue-description {
  @apply text-text-secondary mb-3;
  @apply whitespace-pre-wrap;
}

.acceptance-criteria {
  @apply mt-3 p-3 rounded;
  @apply bg-background-elevated border border-border-primary;
}

.acceptance-criteria strong {
  @apply block mb-1 text-text-primary;
}

.acceptance-criteria p {
  @apply text-text-secondary;
}

.markdown-content {
  @apply prose prose-invert prose-sm max-w-none;
}

.markdown-content :deep(h1) {
  @apply text-lg font-semibold mt-4 mb-2;
}

.markdown-content :deep(h2) {
  @apply text-base font-semibold mt-3 mb-2;
}

.markdown-content :deep(h3) {
  @apply text-sm font-semibold mt-2 mb-1;
}

.markdown-content :deep(p) {
  @apply mb-2;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  @apply ml-4 mb-2;
}

.markdown-content :deep(code) {
  @apply px-1 py-0.5 rounded;
  @apply bg-background-elevated text-text-accent font-mono text-xs;
}

.markdown-content :deep(pre) {
  @apply p-3 rounded;
  @apply bg-background-elevated;
  @apply overflow-x-auto;
}

.markdown-content :deep(pre code) {
  @apply p-0 bg-transparent;
}

.risk-content {
  @apply p-3 rounded;
  @apply bg-background-elevated border-l-2 whitespace-pre-wrap;
  border-left-color: #d29922;
}

.scope-item {
  @apply mb-4;
}

.scope-item strong {
  @apply block mb-2 text-text-primary;
}

.file-list {
  @apply ml-4 space-y-1;
}

.file-list li {
  @apply text-sm font-mono text-text-secondary;
  @apply flex items-center gap-2;
}

.feedback-input {
  @apply w-full px-3 py-2 rounded-lg;
  @apply bg-background-elevated border border-border-primary;
  @apply text-text-primary placeholder-text-secondary;
  @apply focus:outline-none focus:ring-2 focus:ring-border-accent focus:border-transparent;
  @apply resize-none;
}

.slide-over-actions {
  @apply flex gap-2 flex-wrap;
  @apply px-6 py-4;
  @apply border-t border-border-primary;
  @apply flex-shrink-0;
}

.action-btn {
  @apply flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium;
  @apply transition-colors;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
}

.action-primary {
  @apply bg-border-accent text-white;
  @apply hover:bg-text-accent;
}

.action-secondary {
  @apply bg-background-elevated text-text-primary border border-border-primary;
  @apply hover:bg-border-primary;
}

.action-danger {
  @apply bg-status-error text-white;
  @apply hover:bg-opacity-80;
}

/* Transition */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
}

.slide-enter-from .slide-over-panel,
.slide-leave-to .slide-over-panel {
  transform: translateX(100%);
}

/* Scrollbar */
.slide-over-content {
  scrollbar-width: thin;
  scrollbar-color: var(--border-primary) transparent;
}

.slide-over-content::-webkit-scrollbar {
  width: 6px;
}

.slide-over-content::-webkit-scrollbar-track {
  background: transparent;
}

.slide-over-content::-webkit-scrollbar-thumb {
  background: var(--border-primary);
  border-radius: 3px;
}

.slide-over-content::-webkit-scrollbar-thumb:hover {
  background: var(--border-secondary);
}
</style>
