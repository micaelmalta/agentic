<template>
  <div class="toolbar" data-testid="toolbar">
    <div class="logo">
      <span class="logo-dot" />
      <span>Agentic</span>
    </div>

    <div class="toolbar-sep" />

    <div class="toolbar-group flex items-center gap-2">
      <DropdownModal
        v-model="selectedProject"
        :options="projectOptions"
        label="Project"
        placeholder="—"
        :searchable="projectOptions.length > 8"
        testId="project-select"
      />
      <div class="sprint-wrap">
        <DropdownModal
          v-model="jiraMetaStore.selectedBoardId"
          :options="sprintOptions"
          label="Sprint"
          placeholder="—"
          :searchable="sprintOptions.length > 8"
          :disabled="issuesStore.boardIssuesLoading"
          testId="sprint-select"
          @update:model-value="onSprintChange"
        >
          <template #suffix>
            <Loader2 v-if="issuesStore.boardIssuesLoading" :size="14" class="sprint-loader spin" aria-hidden="true" />
          </template>
        </DropdownModal>
      </div>
    </div>

    <div class="toolbar-sep" />

    <button
      data-testid="add-agent-btn"
      :disabled="!agentsStore.canSpawnMore"
      class="btn-primary"
      @click="agentsStore.spawnAgent"
    >
      + Agent
    </button>
    <span data-testid="agent-count" class="pool-count">
      <strong>{{ agentsStore.agents.length }}</strong>/{{ agentsStore.maxAgents }}
    </span>

    <button
      data-testid="stop-all-btn"
      :disabled="agentsStore.runningAgents.length === 0"
      class="btn-secondary"
      @click="handleStopAll"
    >
      Stop All
    </button>

    <div class="spacer" style="flex: 1" />

    <button
      type="button"
      data-testid="autonomous-toggle"
      :class="['auto-pill', agentsStore.autonomousMode ? 'on' : 'off']"
      @click="agentsStore.autonomousMode = !agentsStore.autonomousMode"
    >
      <span class="label">{{ agentsStore.autonomousMode ? 'Auto' : 'Manual' }}</span>
      <span class="dot">⚡</span>
    </button>

    <div class="toolbar-sep" />

    <button type="button" class="btn-icon" title="Search (⌘K)" data-testid="search-btn" @click="openCommandPalette">
      <Search :size="18" />
    </button>
    <button type="button" class="btn-icon relative" title="Notifications" data-testid="notifications-btn" @click="openNotifications">
      <Bell :size="18" />
      <span v-if="notificationCount > 0" class="badge-dot warn" />
    </button>
    <button type="button" class="btn-icon" title="Settings" data-testid="settings-btn" @click="openSettings">
      <Settings :size="18" />
    </button>
    <button type="button" class="btn-icon" :title="darkMode ? 'Light mode' : 'Dark mode'" data-testid="theme-toggle" @click="toggleTheme">
      <component :is="darkMode ? Sun : Moon" :size="18" />
    </button>

    <SettingsModal :is-open="showSettings" @close="closeSettings" @save="saveSettings" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Settings, Search, Bell, Moon, Sun, Loader2 } from 'lucide-vue-next'
import { useAgentsStore } from '../../stores/agents'
import { useJiraMetaStore } from '../../stores/jiraMeta'
import { useIssuesStore } from '../../stores/issues'
import SettingsModal from '../modals/SettingsModal.vue'
import DropdownModal from '../ui/DropdownModal.vue'

const STORAGE_PROJECT = 'toolbar-selected-project'
const STORAGE_BOARD = 'toolbar-selected-board'

const agentsStore = useAgentsStore()
const jiraMetaStore = useJiraMetaStore()
const issuesStore = useIssuesStore()
const showSettings = ref(false)
const selectedProject = ref('')
const darkMode = ref(false)
const notificationCount = ref(0)

const projectOptions = computed(() => [
  { value: '', label: '—' },
  ...jiraMetaStore.sortedProjects.map((p) => ({ value: p.key, label: p.name || p.key }))
])
const sprintOptions = computed(() => [
  { value: '', label: '—' },
  ...jiraMetaStore.boards.map((b) => ({ value: String(b.id), label: b.name || `Board ${b.id}` }))
])

onMounted(async () => {
  const theme = document.documentElement.getAttribute('data-theme')
  darkMode.value = theme !== 'light'
  // Restore theme to localStorage if it was set by inline script (so it persists on next load)
  if (theme === 'dark' || theme === 'light') {
    try {
      localStorage.setItem('toolbar-theme', theme)
    } catch {
      // ignore
    }
  }
  // Restore persisted project/board selection
  try {
    const savedProject = localStorage.getItem(STORAGE_PROJECT)
    const savedBoardId = localStorage.getItem(STORAGE_BOARD)
    if (savedProject) selectedProject.value = savedProject
    if (savedBoardId) jiraMetaStore.selectedBoardId = savedBoardId
  } catch {
    // ignore
  }
  await jiraMetaStore.ensureLoaded()
  if (selectedProject.value) {
    await jiraMetaStore.fetchBoards(selectedProject.value)
    const boards = jiraMetaStore.boards
    const validId = jiraMetaStore.selectedBoardId && boards.some((b) => String(b.id) === jiraMetaStore.selectedBoardId)
    if (!validId) jiraMetaStore.selectedBoardId = ''
  }
  if (jiraMetaStore.selectedBoardId) {
    await issuesStore.fetchBoardIssues()
  }
})

watch(selectedProject, async (projectKey) => {
  try {
    if (projectKey) localStorage.setItem(STORAGE_PROJECT, projectKey)
    else localStorage.removeItem(STORAGE_PROJECT)
  } catch {
    // ignore
  }
  if (projectKey) {
    await jiraMetaStore.fetchBoards(projectKey)
    const validId = jiraMetaStore.selectedBoardId && jiraMetaStore.boards.some((b) => String(b.id) === jiraMetaStore.selectedBoardId)
    if (!validId) jiraMetaStore.selectedBoardId = ''
  } else {
    await jiraMetaStore.fetchBoards(undefined)
  }
}, { immediate: false })

async function onSprintChange() {
  const boardId = jiraMetaStore.selectedBoardId
  try {
    if (boardId) localStorage.setItem(STORAGE_BOARD, boardId)
    else localStorage.removeItem(STORAGE_BOARD)
  } catch {
    // ignore
  }
  await issuesStore.fetchBoardIssues()
}

watch(() => jiraMetaStore.selectedBoardId, (boardId) => {
  try {
    if (boardId) localStorage.setItem(STORAGE_BOARD, boardId)
    else localStorage.removeItem(STORAGE_BOARD)
  } catch {
    // ignore
  }
}, { immediate: true })

watch(() => agentsStore.autonomousMode, (v) => {
  try {
    localStorage.setItem('toolbar-autonomous', String(v))
  } catch {
    // ignore
  }
}, { immediate: true })

function handleStopAll() {
  if (confirm('Are you sure you want to stop all running agents?')) {
    agentsStore.stopAllAgents()
  }
}

function openSettings() {
  showSettings.value = true
}

function closeSettings() {
  showSettings.value = false
}

function saveSettings(config: any) {
  if (config.agents) {
    agentsStore.maxAgents = config.agents.maxAgents
  }
}

function openCommandPalette() {
  document.dispatchEvent(new CustomEvent('open-command-palette'))
}

function openNotifications() {
  document.dispatchEvent(new CustomEvent('open-notifications'))
}

function toggleTheme() {
  darkMode.value = !darkMode.value
  const theme = darkMode.value ? 'dark' : 'light'
  document.documentElement.setAttribute('data-theme', theme)
  try {
    localStorage.setItem('toolbar-theme', theme)
  } catch {
    // ignore
  }
}
</script>

<style scoped>
.auto-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 4px 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  background: none;
  transition: all 0.2s;
}
.auto-pill.on { background: var(--success-dim); color: var(--success); }
.auto-pill.off { background: var(--bg-elevated); color: var(--text-muted); }
.auto-pill .dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
}
.auto-pill.on .dot { background: var(--success); color: var(--btn-primary-text); }
.auto-pill.off .dot { background: var(--bg-hover); color: var(--text-muted); }

.btn-secondary {
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg-elevated);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-secondary:hover { color: var(--text-primary); border-color: var(--text-muted); background: var(--bg-hover); }
.btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }

.select-minimal {
  background: none;
  color: var(--text-primary);
  border: none;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  outline: none;
  padding: 4px 0;
}
.select-minimal option { background: var(--bg-surface); color: var(--text-primary); }

.badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  position: absolute;
  top: 4px;
  right: 4px;
}
.badge-dot.warn { background: var(--warning); }

.sprint-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}
.sprint-loader {
  flex-shrink: 0;
  color: var(--accent);
}
.sprint-loader.spin {
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
