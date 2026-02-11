import JiraClient from 'jira-client';
import type { Issue, IssueTransition } from '../types/issue.js';

export interface JiraConfig {
  host: string;
  username: string;
  password: string;
  boardId: string;
}

export class JiraService {
  private client: JiraClient;
  private config: JiraConfig;
  private issueCache: Issue[] | null = null;
  private issueCacheBoardId: string | null = null;
  private pollingInterval: NodeJS.Timeout | null = null;
  private abortController: AbortController | null = null;

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

  async getBoardIssues(): Promise<Issue[]> {
    // Return cached if available
    if (this.issueCache) {
      return this.issueCache;
    }

    try {
      const response = await this.client.getIssuesForBoard(this.config.boardId);
      const issues: Issue[] = response.issues.map((jiraIssue: any) => ({
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
      }));

      this.issueCache = issues;
      return issues;
    } catch (error) {
      console.error('Failed to fetch board issues:', error);
      throw error;
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

  /**
   * Gracefully shutdown Jira service by stopping polling and aborting ongoing requests.
   */
  async shutdown(): Promise<void> {
    console.log('🔄 Shutting down Jira service...');

    // Stop polling
    this.stopPolling();

    // Abort any ongoing requests
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    // Clear caches
    this.invalidateCache();

    console.log('✅ Jira service shut down');
  }

  private mapPriority(jiraPriority: string | undefined): 'Critical' | 'High' | 'Medium' | 'Low' {
    if (!jiraPriority) return 'Medium';

    const priority = jiraPriority.toLowerCase();
    if (priority.includes('critical') || priority.includes('highest')) return 'Critical';
    if (priority.includes('high')) return 'High';
    if (priority.includes('low') || priority.includes('lowest')) return 'Low';
    return 'Medium';
  }
}
