import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const CACHE_KEY_PROJECTS = 'jira-meta-projects'
const CACHE_KEY_BOARDS_PREFIX = 'jira-meta-boards-'
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

export interface JiraProject {
  key: string
  name: string
}

export interface JiraBoard {
  id: number
  name: string
}

function loadCached<T>(key: string): { data: T; at: number } | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const { data, at } = JSON.parse(raw)
    if (Date.now() - at > CACHE_TTL_MS) return null
    return { data, at }
  } catch {
    return null
  }
}

function saveCached(key: string, data: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify({ data, at: Date.now() }))
  } catch {
    // ignore quota or parse errors
  }
}

export const useJiraMetaStore = defineStore('jiraMeta', () => {
  const projects = ref<JiraProject[]>([])
  const boards = ref<JiraBoard[]>([])
  const boardsProjectKey = ref<string>('') // which project the current boards list is for
  /** Selected board ID (used for fetching board issues and for polling). */
  const selectedBoardId = ref<string>('')
  const projectsLoadedAt = ref<number>(0)
  const boardsLoadedAt = ref<number>(0)

  /** Projects sorted alphabetically by name (for dropdowns). */
  const sortedProjects = computed(() =>
    [...projects.value].sort((a, b) =>
      (a.name || a.key).localeCompare(b.name || b.key, undefined, { sensitivity: 'base' })
    )
  )
  const projectOptions = computed(() =>
    sortedProjects.value.map((p) => p.name || p.key)
  )
  const boardOptions = computed(() =>
    boards.value.map((b) => b.name || `Board ${b.id}`)
  )

  async function fetchProjects(force = false): Promise<JiraProject[]> {
    if (!force && projects.value.length && Date.now() - projectsLoadedAt.value < CACHE_TTL_MS) {
      return projects.value
    }
    const cached = loadCached<JiraProject[]>(CACHE_KEY_PROJECTS)
    if (!force && cached) {
      projects.value = cached.data
      projectsLoadedAt.value = cached.at
      return projects.value
    }
    try {
      const res = await fetch('/api/jira/projects')
      if (!res.ok) throw new Error(await res.text() || res.statusText)
      const data = await res.json()
      projects.value = Array.isArray(data) ? data : []
      projectsLoadedAt.value = Date.now()
      saveCached(CACHE_KEY_PROJECTS, projects.value)
      return projects.value
    } catch (e) {
      console.error('Failed to fetch Jira projects:', e)
      if (projects.value.length) return projects.value
      return []
    }
  }

  async function fetchBoards(projectKey: string | undefined, force = false): Promise<JiraBoard[]> {
    if (!projectKey) {
      boards.value = []
      boardsProjectKey.value = ''
      selectedBoardId.value = ''
      return []
    }
    const cacheKey = CACHE_KEY_BOARDS_PREFIX + projectKey
    if (!force && boards.value.length && boardsProjectKey.value === projectKey && Date.now() - boardsLoadedAt.value < CACHE_TTL_MS) {
      return boards.value
    }
    const cached = loadCached<JiraBoard[]>(cacheKey)
    if (!force && cached) {
      boards.value = cached.data
      boardsProjectKey.value = projectKey
      boardsLoadedAt.value = cached.at
      return boards.value
    }
    try {
      const url = `/api/jira/boards?project=${encodeURIComponent(projectKey)}`
      const res = await fetch(url)
      if (!res.ok) throw new Error(await res.text() || res.statusText)
      const data = await res.json()
      boards.value = Array.isArray(data) ? data : []
      boardsProjectKey.value = projectKey
      boardsLoadedAt.value = Date.now()
      saveCached(cacheKey, boards.value)
      return boards.value
    } catch (e) {
      console.error('Failed to fetch Jira boards:', e)
      if (boards.value.length && boardsProjectKey.value === projectKey) return boards.value
      return []
    }
  }

  /** Load projects only (boards are loaded when a project is selected). */
  async function ensureLoaded() {
    await fetchProjects()
  }

  function invalidateCache() {
    projects.value = []
    boards.value = []
    boardsProjectKey.value = ''
    selectedBoardId.value = ''
    projectsLoadedAt.value = 0
    boardsLoadedAt.value = 0
    try {
      localStorage.removeItem(CACHE_KEY_PROJECTS)
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (k?.startsWith(CACHE_KEY_BOARDS_PREFIX)) keysToRemove.push(k)
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k))
    } catch {
      // ignore
    }
  }

  return {
    projects,
    boards,
    selectedBoardId,
    sortedProjects,
    projectOptions,
    boardOptions,
    fetchProjects,
    fetchBoards,
    ensureLoaded,
    invalidateCache,
  }
})
