import JiraClient from 'jira-client';
import type { Issue, IssueTransition } from '../types/issue.js';

export interface JiraConfig {
  host: string;
  username: string;
  password: string;
  boardId: string;
}

const META_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export interface JiraProject {
  key: string;
  name: string;
}

export interface JiraBoard {
  id: number;
  name: string;
}

export class JiraService {
  private client: JiraClient;
  private config: JiraConfig;
  private issueCache: Issue[] | null = null;
  private issueCacheBoardId: string | null = null; // which board the issue cache is for
  private currentBoardId: string | null = null; // set by frontend when user selects a board; used by polling
  private projectsCache: { data: JiraProject[]; at: number } | null = null;
  /** Cache key: '' for all boards, or projectKey for boards of that project */
  private boardsCacheMap: Map<string, { data: JiraBoard[]; at: number }> = new Map();
  private pollingInterval: NodeJS.Timeout | null = null;

  constructor(config: JiraConfig) {
    this.config = config;
    this.client = new JiraClient({
      protocol: 'https',
      host: config.host,
      username: config.username,
      password: config.password,
      apiVersion: '2',
      strictSSL: true
    });
  }

  async getBoardIssues(boardId?: string): Promise<Issue[]> {
    const effectiveBoardId = boardId ?? this.currentBoardId ?? this.config.boardId;
    if (!effectiveBoardId) {
      return [];
    }
    if (boardId != null) {
      this.currentBoardId = String(boardId);
    }
    // Return cached if available for this board
    if (this.issueCache && this.issueCacheBoardId === effectiveBoardId) {
      return this.issueCache;
    }
    if (this.issueCacheBoardId !== effectiveBoardId) {
      this.issueCache = null;
      this.issueCacheBoardId = null;
    }

    try {
      // Fetch all issues with pagination
      let allJiraIssues: any[] = [];
      let startAt = 0;
      const maxResults = 50;
      let totalIssues = 0;

      do {
        const response = await this.client.getIssuesForBoard(
          effectiveBoardId,
          startAt,
          maxResults
        );

        totalIssues = response.total;
        allJiraIssues = allJiraIssues.concat(response.issues);
        startAt += response.issues.length;

        // Stop if we've got all issues
        if (startAt >= totalIssues) break;
      } while (startAt < totalIssues);

      console.log(`✅ Fetched ${allJiraIssues.length} of ${totalIssues} issues from board ${effectiveBoardId}`);

      // Preserve agentId and manualMode from existing cache
      const oldCacheMap = new Map(
        (this.issueCache || []).map(issue => [issue.key, { agentId: issue.agentId, manualMode: issue.manualMode }])
      );

      const issues: Issue[] = allJiraIssues.map((jiraIssue: any) => {
        const oldData = oldCacheMap.get(jiraIssue.key);
        return {
          key: jiraIssue.key,
          summary: jiraIssue.fields.summary,
          description: jiraIssue.fields.description || '',
          status: this.mapStatus(jiraIssue.fields.status.name),
          priority: this.mapPriority(jiraIssue.fields.priority?.name),
          issueType: jiraIssue.fields.issuetype.name,
          assignee: jiraIssue.fields.assignee ? {
            accountId: jiraIssue.fields.assignee.accountId,
            displayName: jiraIssue.fields.assignee.displayName,
            emailAddress: jiraIssue.fields.assignee.emailAddress,
            avatarUrl: jiraIssue.fields.assignee.avatarUrls?.['48x48']
          } : null,
          reporter: {
            accountId: jiraIssue.fields.reporter.accountId,
            displayName: jiraIssue.fields.reporter.displayName,
            emailAddress: jiraIssue.fields.reporter.emailAddress,
            avatarUrl: jiraIssue.fields.reporter.avatarUrls?.['48x48']
          },
          labels: jiraIssue.fields.labels || [],
          sprint: jiraIssue.fields.sprint?.name || null,
          agentId: oldData?.agentId || null,
          manualMode: oldData?.manualMode || false,
          updatedAt: new Date(jiraIssue.fields.updated)
        };
      });

      this.issueCache = issues;
      this.issueCacheBoardId = effectiveBoardId;
      return issues;
    } catch (error) {
      console.error('Failed to fetch board issues:', error);
      // Return cached data if available for this board, otherwise empty array
      if (this.issueCache && this.issueCacheBoardId === effectiveBoardId) return this.issueCache;
      return [];
    }
  }

  async getIssue(issueKey: string): Promise<Issue> {
    try {
      const jiraIssue = await this.client.findIssue(issueKey);

      return {
        key: jiraIssue.key,
        summary: jiraIssue.fields.summary,
        description: jiraIssue.fields.description || '',
        status: jiraIssue.fields.status.name,
        priority: this.mapPriority(jiraIssue.fields.priority?.name),
        issueType: jiraIssue.fields.issuetype.name,
        assignee: jiraIssue.fields.assignee ? {
          accountId: jiraIssue.fields.assignee.accountId,
          displayName: jiraIssue.fields.assignee.displayName,
          emailAddress: jiraIssue.fields.assignee.emailAddress,
          avatarUrl: jiraIssue.fields.assignee.avatarUrls?.['48x48']
        } : null,
        reporter: {
          accountId: jiraIssue.fields.reporter.accountId,
          displayName: jiraIssue.fields.reporter.displayName,
          emailAddress: jiraIssue.fields.reporter.emailAddress,
          avatarUrl: jiraIssue.fields.reporter.avatarUrls?.['48x48']
        },
        labels: jiraIssue.fields.labels || [],
        sprint: jiraIssue.fields.sprint?.name || null,
        agentId: null,
        manualMode: false,
        updatedAt: new Date(jiraIssue.fields.updated)
      };
    } catch (error) {
      console.error(`Failed to fetch issue ${issueKey}:`, error);
      throw error;
    }
  }

  async getAvailableTransitions(issueKey: string): Promise<IssueTransition[]> {
    try {
      const response = await this.client.listTransitions(issueKey);

      return response.transitions.map((t: any) => ({
        id: t.id,
        name: t.name,
        to: {
          id: t.to.id,
          name: t.to.name
        }
      }));
    } catch (error) {
      console.error(`Failed to get transitions for ${issueKey}:`, error);
      throw error;
    }
  }

  async transitionIssue(issueKey: string, targetStatus: string): Promise<void> {
    try {
      const transitions = await this.getAvailableTransitions(issueKey);
      const transition = transitions.find(t =>
        t.to.name.toLowerCase() === targetStatus.toLowerCase()
      );

      if (!transition) {
        throw new Error(`No transition found to status: ${targetStatus}`);
      }

      await this.client.transitionIssue(issueKey, {
        transition: { id: transition.id }
      });

      this.invalidateCache();
    } catch (error) {
      console.error(`Failed to transition ${issueKey} to ${targetStatus}:`, error);
      throw error;
    }
  }

  async assignIssue(issueKey: string, accountId: string): Promise<void> {
    try {
      await this.client.updateIssue(issueKey, {
        fields: {
          assignee: { accountId }
        }
      });

      this.invalidateCache();
    } catch (error) {
      console.error(`Failed to assign ${issueKey} to ${accountId}:`, error);
      throw error;
    }
  }

  startPolling(callback: (issues: Issue[]) => void, intervalMs: number = 15000): void {
    if (this.pollingInterval) {
      this.stopPolling();
    }

    const poll = async () => {
      try {
        this.invalidateCache();
        const issues = await this.getBoardIssues();
        callback(issues);
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    // Initial poll
    poll();

    // Set up interval
    this.pollingInterval = setInterval(poll, intervalMs);
  }

  stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  isPolling(): boolean {
    return this.pollingInterval !== null;
  }

  invalidateCache(): void {
    this.issueCache = null;
    this.issueCacheBoardId = null;
  }

  /** Fetch Jira REST API with Basic auth (used for projects and agile boards). */
  private async jiraFetch(path: string): Promise<any> {
    const base = this.config.host.replace(/^https?:\/\//, '');
    const url = `https://${base}${path}`;
    const auth = Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64');
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        Authorization: `Basic ${auth}`,
      },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Jira API ${res.status}: ${text || res.statusText}`);
    }
    return res.json();
  }

  async getProjects(): Promise<JiraProject[]> {
    if (this.projectsCache && Date.now() - this.projectsCache.at < META_CACHE_TTL_MS) {
      return this.projectsCache.data;
    }
    try {
      const list = await this.jiraFetch('/rest/api/2/project');
      const data = (Array.isArray(list) ? list : []).map((p: any) => ({
        key: p.key || p.id,
        name: p.name || p.key || String(p.id),
      }));
      data.sort((a, b) => (a.name || a.key).localeCompare(b.name || b.key, undefined, { sensitivity: 'base' }));
      this.projectsCache = { data, at: Date.now() };
      return data;
    } catch (error) {
      console.error('Failed to fetch Jira projects:', error);
      return this.projectsCache?.data ?? [];
    }
  }

  async getBoards(projectKey?: string): Promise<JiraBoard[]> {
    const cacheKey = projectKey ?? '';
    const cached = this.boardsCacheMap.get(cacheKey);
    if (cached && Date.now() - cached.at < META_CACHE_TTL_MS) {
      return cached.data;
    }
    try {
      const query = new URLSearchParams({ maxResults: '100' });
      if (projectKey) query.set('projectKeyOrId', projectKey);
      const result = await this.jiraFetch(`/rest/agile/1.0/board?${query.toString()}`);
      const values = result?.values ?? result ?? [];
      const data = (Array.isArray(values) ? values : []).map((b: any) => ({
        id: b.id,
        name: b.name || `Board ${b.id}`,
      }));
      this.boardsCacheMap.set(cacheKey, { data, at: Date.now() });
      return data;
    } catch (error) {
      console.error('Failed to fetch Jira boards:', error);
      const existing = this.boardsCacheMap.get(cacheKey);
      return existing?.data ?? [];
    }
  }

  async updateIssueAgentId(issueKey: string, agentId: string | null): Promise<void> {
    console.log(`🔄 Updating issue ${issueKey} agentId to:`, agentId);

    // Ensure cache is populated
    if (!this.issueCache) {
      console.log(`⚠️  Cache empty, fetching issues first...`);
      await this.getBoardIssues();
    }

    if (this.issueCache) {
      const issue = this.issueCache.find(i => i.key === issueKey);
      if (issue) {
        issue.agentId = agentId;
        issue.updatedAt = new Date();
        console.log(`✅ Updated issue ${issueKey} agentId to:`, issue.agentId);
      } else {
        console.log(`⚠️  Issue ${issueKey} not found in cache`);
      }
    }
  }

  private mapPriority(jiraPriority: string | undefined): 'Critical' | 'High' | 'Medium' | 'Low' {
    if (!jiraPriority) return 'Medium';

    const priority = jiraPriority.toLowerCase();
    if (priority.includes('critical') || priority.includes('highest')) return 'Critical';
    if (priority.includes('high')) return 'High';
    if (priority.includes('low') || priority.includes('lowest')) return 'Low';
    return 'Medium';
  }

  private mapStatus(jiraStatus: string): string {
    // Map Jira statuses to our Kanban columns
    const status = jiraStatus.toLowerCase();

    // "In Code Review" column
    if (status.includes('code review') || status.includes('review')) {
      return 'In Code Review';
    }

    // "In Progress" column
    if (status.includes('in progress') || status.includes('on dev') || status.includes('on staging')) {
      return 'In Progress';
    }

    // "Done" column
    if (status.includes('done')) {
      return 'Done';
    }

    // "To Do" column (default for everything else)
    return 'To Do';
  }
}
