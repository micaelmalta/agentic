<template>
  <Teleport to="body">
    <div v-if="isOpen" class="settings-modal-overlay" @click="closeModal">
      <div class="settings-modal" @click.stop>
        <!-- Header -->
        <div class="modal-header">
          <h2>Settings</h2>
          <button class="close-btn" @click="closeModal" aria-label="Close settings">
            <X :size="20" />
          </button>
        </div>

        <!-- Tabs -->
        <div class="tabs">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            :class="['tab', { active: activeTab === tab.id }]"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- Tab Content -->
        <div class="modal-content">
          <!-- Connections Tab -->
          <div v-if="activeTab === 'connections'" class="tab-content">
            <!-- Jira Connection -->
            <section class="settings-section">
              <h3>Jira Connection</h3>
              <div class="form-group">
                <label for="jira-url">Instance URL</label>
                <input
                  id="jira-url"
                  v-model="jiraConfig.instanceUrl"
                  type="text"
                  placeholder="https://yourteam.atlassian.net"
                />
              </div>
              <div class="form-group">
                <label for="jira-email">Email</label>
                <input
                  id="jira-email"
                  v-model="jiraConfig.email"
                  type="email"
                  placeholder="you@company.com"
                />
              </div>
              <div class="form-group">
                <label for="jira-token">API Token</label>
                <input
                  id="jira-token"
                  v-model="jiraConfig.apiToken"
                  type="password"
                  placeholder="••••••••••••••••"
                />
              </div>
              <div class="form-group">
                <label for="jira-project">Project</label>
                <select id="jira-project" v-model="jiraConfig.project">
                  <option value="">Select project...</option>
                  <option v-for="p in jiraMetaStore.sortedProjects" :key="p.key" :value="p.key">
                    {{ p.name || p.key }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label for="jira-board">Board</label>
                <select id="jira-board" v-model="jiraConfig.board">
                  <option value="">Select board...</option>
                  <option v-for="board in availableBoards" :key="board" :value="board">
                    {{ board }}
                  </option>
                </select>
              </div>
              <div class="test-connection">
                <button class="test-btn" @click="testJiraConnection" :disabled="testingJira">
                  <Loader v-if="testingJira" :size="16" class="spinner" />
                  <span v-else>Test Connection</span>
                </button>
                <span v-if="jiraConnectionStatus === 'connected'" class="status success">
                  <CheckCircle :size="16" /> Connected
                </span>
                <span v-if="jiraConnectionStatus === 'failed'" class="status error">
                  <XCircle :size="16" /> Connection failed
                </span>
              </div>
            </section>

            <!-- Datadog Connection -->
            <section class="settings-section">
              <h3>Datadog Connection</h3>
              <div class="form-group">
                <label for="datadog-api-key">API Key</label>
                <input
                  id="datadog-api-key"
                  v-model="datadogConfig.apiKey"
                  type="password"
                  placeholder="••••••••••••••••"
                />
              </div>
              <div class="form-group">
                <label for="datadog-app-key">App Key</label>
                <input
                  id="datadog-app-key"
                  v-model="datadogConfig.appKey"
                  type="password"
                  placeholder="••••••••••••••••"
                />
              </div>
              <div class="test-connection">
                <button class="test-btn" @click="testDatadogConnection" :disabled="testingDatadog">
                  <Loader v-if="testingDatadog" :size="16" class="spinner" />
                  <span v-else>Test Connection</span>
                </button>
                <span v-if="datadogConnectionStatus === 'connected'" class="status success">
                  <CheckCircle :size="16" /> Connected
                </span>
                <span v-if="datadogConnectionStatus === 'failed'" class="status error">
                  <XCircle :size="16" /> Connection failed
                </span>
              </div>
            </section>

            <!-- GitHub Connection -->
            <section class="settings-section">
              <h3>GitHub</h3>
              <div class="github-status">
                <span v-if="githubStatus === 'connected'" class="status success">
                  <CheckCircle :size="16" /> Connected via gh CLI
                </span>
                <span v-else class="status error">
                  <XCircle :size="16" /> Not connected. Run <code>gh auth login</code> in terminal.
                </span>
              </div>
            </section>
          </div>

          <!-- Agents Tab -->
          <div v-if="activeTab === 'agents'" class="tab-content">
            <section class="settings-section">
              <h3>Agent Pool</h3>
              <div class="form-group">
                <label for="max-agents">Max concurrent agents</label>
                <select id="max-agents" v-model.number="agentConfig.maxAgents">
                  <option :value="2">2</option>
                  <option :value="4">4</option>
                  <option :value="6">6</option>
                  <option :value="8">8</option>
                </select>
                <p class="help-text">
                  Limit how many agents can run at once. Set based on your machine resources and API rate limits.
                </p>
              </div>
              <div class="form-group">
                <label>Auto-scale</label>
                <div class="toggle-group">
                  <button
                    :class="['toggle', { active: agentConfig.autoScale }]"
                    @click="agentConfig.autoScale = !agentConfig.autoScale"
                  >
                    <span class="toggle-track">
                      <span class="toggle-thumb"></span>
                    </span>
                    <span class="toggle-label">{{ agentConfig.autoScale ? 'ON' : 'OFF' }}</span>
                  </button>
                </div>
                <p class="help-text">
                  Automatically spawn agents up to max when unassigned issues exist in autonomous mode.
                </p>
              </div>
              <div class="form-group">
                <label for="min-idle">Min idle agents</label>
                <select id="min-idle" v-model.number="agentConfig.minIdle">
                  <option :value="0">0</option>
                  <option :value="1">1</option>
                  <option :value="2">2</option>
                </select>
                <p class="help-text">
                  Keep N agents idle and ready for fast assignment. 0 = only spawn on demand.
                </p>
              </div>
            </section>
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-footer">
          <button class="cancel-btn" @click="closeModal">Cancel</button>
          <button class="save-btn" @click="saveSettings">Save</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { X, CheckCircle, XCircle, Loader } from 'lucide-vue-next'
import { useJiraMetaStore } from '../../stores/jiraMeta'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
  save: [config: any]
}>()

const jiraMetaStore = useJiraMetaStore()
const tabs = [
  { id: 'connections', label: 'Connections' },
  { id: 'agents', label: 'Agents' }
]

const activeTab = ref('connections')

// Jira config
const jiraConfig = ref({
  instanceUrl: '',
  email: '',
  apiToken: '',
  project: '',
  board: ''
})

const availableBoards = computed(() => jiraMetaStore.boardOptions)
const jiraConnectionStatus = ref<'idle' | 'connected' | 'failed'>('idle')
const testingJira = ref(false)

// Datadog config
const datadogConfig = ref({
  apiKey: '',
  appKey: ''
})

const datadogConnectionStatus = ref<'idle' | 'connected' | 'failed'>('idle')
const testingDatadog = ref(false)

// GitHub status
const githubStatus = ref<'connected' | 'disconnected'>('connected')

// Agent config
const agentConfig = ref({
  maxAgents: 4,
  autoScale: false,
  minIdle: 1
})

async function testJiraConnection() {
  testingJira.value = true
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    jiraConnectionStatus.value = 'connected'
  } catch (error) {
    jiraConnectionStatus.value = 'failed'
  } finally {
    testingJira.value = false
  }
}

async function testDatadogConnection() {
  testingDatadog.value = true
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    datadogConnectionStatus.value = 'connected'
  } catch (error) {
    datadogConnectionStatus.value = 'failed'
  } finally {
    testingDatadog.value = false
  }
}

function closeModal() {
  emit('close')
}

function saveSettings() {
  emit('save', {
    jira: jiraConfig.value,
    datadog: datadogConfig.value,
    agents: agentConfig.value
  })
  closeModal()
}

// Reset connection status when config changes
watch(jiraConfig, () => { jiraConnectionStatus.value = 'idle' }, { deep: true })
watch(datadogConfig, () => { datadogConnectionStatus.value = 'idle' }, { deep: true })

// Load projects when opening settings; load boards when project is selected
watch(() => props.isOpen, (open) => {
  if (open) {
    jiraMetaStore.ensureLoaded()
    if (jiraConfig.value.project) {
      jiraMetaStore.fetchBoards(jiraConfig.value.project)
    }
  }
})
watch(() => jiraConfig.value.project, (projectKey) => {
  if (projectKey) jiraMetaStore.fetchBoards(projectKey)
  else jiraMetaStore.fetchBoards(undefined)
})
</script>

<style scoped>
.settings-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 40;
  animation: fadeIn 200ms ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.settings-modal {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  width: 640px;
  max-width: 90vw;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  animation: slideUp 250ms ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-lg);
  border-bottom: 1px solid var(--border);
}

.modal-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background 150ms, color 150ms;
}

.close-btn:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
}

.tabs {
  display: flex;
  gap: var(--space-sm);
  padding: 0 var(--space-lg);
  border-bottom: 1px solid var(--border);
}

.tab {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  padding: var(--space-md) var(--space-sm);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: color 150ms, border-color 150ms;
}

.tab:hover {
  color: var(--text-primary);
}

.tab.active {
  color: var(--accent);
  border-bottom-color: var(--accent);
}

.modal-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-lg);
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.settings-section h3 {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--space-sm) 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.form-group label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary);
}

.form-group input,
.form-group select {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: var(--space-sm) var(--space-md);
  font-size: 13px;
  color: var(--text-primary);
  transition: border-color 150ms;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--accent);
}

.form-group input::placeholder {
  color: var(--text-muted);
}

.help-text {
  font-size: 11px;
  color: var(--text-secondary);
  margin: 0;
}

.test-connection {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.test-btn {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: var(--space-sm) var(--space-md);
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
  transition: background 150ms, border-color 150ms;
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.test-btn:hover:not(:disabled) {
  background: var(--bg-surface);
  border-color: var(--accent);
}

.test-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.status {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: 12px;
  font-weight: 500;
}

.status.success {
  color: var(--success);
}

.status.error {
  color: var(--danger);
}

.github-status {
  padding: var(--space-md);
  background: var(--bg-elevated);
  border-radius: 6px;
}

.github-status code {
  background: var(--bg-primary);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
}

.toggle-group {
  display: flex;
  align-items: center;
}

.toggle {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 0;
}

.toggle-track {
  width: 44px;
  height: 24px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 12px;
  position: relative;
  transition: background 200ms, border-color 200ms;
}

.toggle.active .toggle-track {
  background: var(--accent-emphasis);
  border-color: var(--accent-emphasis);
}

.toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  background: white;
  border-radius: 50%;
  transition: transform 200ms;
}

.toggle.active .toggle-thumb {
  transform: translateX(20px);
}

.toggle-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.toggle.active .toggle-label {
  color: var(--accent);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-md);
  padding: var(--space-lg);
  border-top: 1px solid var(--border);
}

.cancel-btn,
.save-btn {
  padding: var(--space-sm) var(--space-lg);
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms;
}

.cancel-btn {
  background: none;
  border: 1px solid var(--border);
  color: var(--text-secondary);
}

.cancel-btn:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
}

.save-btn {
  background: var(--accent-emphasis);
  border: none;
  color: white;
}

.save-btn:hover {
  background: var(--accent);
}
</style>
