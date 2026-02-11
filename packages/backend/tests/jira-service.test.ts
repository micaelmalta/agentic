import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import type { Issue } from '../src/types/issue.js';

// Test fixtures
const mockJiraIssueResponse = {
  key: 'PROJ-123',
  fields: {
    summary: 'Test Issue',
    description: 'Test Description',
    status: { name: 'To Do' },
    priority: { name: 'High' },
    issuetype: { name: 'Task' },
    assignee: {
      accountId: 'assignee-123',
      displayName: 'John Doe',
      emailAddress: 'john@example.com',
      avatarUrls: { '48x48': 'https://example.com/avatar.png' }
    },
    reporter: {
      accountId: 'reporter-456',
      displayName: 'Jane Smith',
      emailAddress: 'jane@example.com',
      avatarUrls: { '48x48': 'https://example.com/reporter-avatar.png' }
    },
    labels: ['backend', 'urgent'],
    sprint: { name: 'Sprint 1' },
    updated: '2024-01-01T00:00:00.000Z'
  }
};

const mockBoardIssuesResponse = {
  issues: [
    mockJiraIssueResponse,
    {
      key: 'PROJ-124',
      fields: {
        summary: 'Another Issue',
        description: '',
        status: { name: 'In Progress' },
        priority: { name: 'Medium' },
        issuetype: { name: 'Bug' },
        assignee: null,
        reporter: {
          accountId: 'reporter-789',
          displayName: 'Bob Wilson',
          emailAddress: 'bob@example.com',
          avatarUrls: { '48x48': 'https://example.com/bob-avatar.png' }
        },
        labels: [],
        sprint: null,
        updated: '2024-01-02T00:00:00.000Z'
      }
    }
  ]
};

const mockTransitionsResponse = {
  transitions: [
    {
      id: '11',
      name: 'To Do',
      to: { id: '10001', name: 'To Do' }
    },
    {
      id: '21',
      name: 'In Progress',
      to: { id: '10002', name: 'In Progress' }
    },
    {
      id: '31',
      name: 'Done',
      to: { id: '10003', name: 'Done' }
    }
  ]
};

// Create mock functions that will be available before hoisting
const mockGetIssuesForBoard = jest.fn<() => Promise<any>>();
const mockFindIssue = jest.fn<() => Promise<any>>();
const mockListTransitions = jest.fn<() => Promise<any>>();
const mockTransitionIssue = jest.fn<() => Promise<void>>();
const mockUpdateIssue = jest.fn<() => Promise<void>>();

// Mock jira-client before imports
jest.mock('jira-client', () => {
  return jest.fn().mockImplementation(() => ({
    // @ts-expect-error - Mocking with spread arguments
    getIssuesForBoard: (...args: any[]) => mockGetIssuesForBoard(...args),
    // @ts-expect-error - Mocking with spread arguments
    findIssue: (...args: any[]) => mockFindIssue(...args),
    // @ts-expect-error - Mocking with spread arguments
    listTransitions: (...args: any[]) => mockListTransitions(...args),
    // @ts-expect-error - Mocking with spread arguments
    transitionIssue: (...args: any[]) => mockTransitionIssue(...args),
    // @ts-expect-error - Mocking with spread arguments
    updateIssue: (...args: any[]) => mockUpdateIssue(...args)
  }));
});

// Import after mock is set up
const { JiraService } = await import('../src/services/jira-service.js');

describe('JiraService', () => {
  let service: typeof JiraService.prototype;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Setup default mock implementations
    mockGetIssuesForBoard.mockResolvedValue(mockBoardIssuesResponse);
    mockFindIssue.mockResolvedValue(mockJiraIssueResponse);
    mockListTransitions.mockResolvedValue(mockTransitionsResponse);
    mockTransitionIssue.mockResolvedValue(undefined);
    mockUpdateIssue.mockResolvedValue(undefined);

    service = new JiraService({
      host: 'test.atlassian.net',
      username: 'test@example.com',
      password: 'test-token',
      boardId: '1'
    });
  });

  describe('getBoardIssues', () => {
    it('should fetch and cache board issues', async () => {
      const issues = await service.getBoardIssues();

      expect(Array.isArray(issues)).toBe(true);
      expect(issues).toHaveLength(2);
      expect(issues[0].key).toBe('PROJ-123');
      expect(issues[0].summary).toBe('Test Issue');
      expect(issues[0].status).toBe('To Do');
      expect(issues[0].priority).toBe('High');
      expect(mockGetIssuesForBoard).toHaveBeenCalledTimes(1);
    });

    it('should return cached issues on subsequent calls', async () => {
      const issues1 = await service.getBoardIssues();
      const issues2 = await service.getBoardIssues();

      expect(issues1).toBe(issues2); // Same reference = cached
      expect(mockGetIssuesForBoard).toHaveBeenCalledTimes(1); // Only called once
    });
  });

  describe('getIssue', () => {
    it('should fetch specific issue by key', async () => {
      const issue = await service.getIssue('PROJ-123');

      expect(issue).toBeDefined();
      expect(issue.key).toBe('PROJ-123');
      expect(issue.summary).toBe('Test Issue');
      expect(issue.status).toBe('To Do');
      expect(mockFindIssue).toHaveBeenCalledWith('PROJ-123');
    });

    it('should throw error for invalid issue key', async () => {
      mockFindIssue.mockRejectedValueOnce(
        new Error('Issue does not exist or you do not have permission to see it.')
      );

      await expect(service.getIssue('INVALID')).rejects.toThrow();
      expect(mockFindIssue).toHaveBeenCalledWith('INVALID');
    });
  });

  describe('transitionIssue', () => {
    it('should transition issue to new status', async () => {
      await service.transitionIssue('PROJ-123', 'In Progress');

      expect(mockListTransitions).toHaveBeenCalledWith('PROJ-123');
      expect(mockTransitionIssue).toHaveBeenCalledWith('PROJ-123', {
        transition: { id: '21' }
      });
    });

    it('should invalidate cache after transition', async () => {
      await service.getBoardIssues(); // Populate cache
      expect(mockGetIssuesForBoard).toHaveBeenCalledTimes(1);

      await service.transitionIssue('PROJ-123', 'In Progress');

      // Next call should fetch fresh data (cache invalidated)
      const issues = await service.getBoardIssues();
      expect(issues).toBeDefined();
      expect(mockGetIssuesForBoard).toHaveBeenCalledTimes(2); // Called again after cache invalidation
    });
  });

  describe('getAvailableTransitions', () => {
    it('should return available transitions for issue', async () => {
      const transitions = await service.getAvailableTransitions('PROJ-123');

      expect(Array.isArray(transitions)).toBe(true);
      expect(transitions).toHaveLength(3);
      expect(transitions[0]).toEqual({
        id: '11',
        name: 'To Do',
        to: { id: '10001', name: 'To Do' }
      });
      expect(mockListTransitions).toHaveBeenCalledWith('PROJ-123');
    });
  });

  describe('assignIssue', () => {
    it('should assign issue to user', async () => {
      await service.assignIssue('PROJ-123', 'user@example.com');

      expect(mockUpdateIssue).toHaveBeenCalledWith('PROJ-123', {
        fields: {
          assignee: { accountId: 'user@example.com' }
        }
      });
    });

    it('should invalidate cache after assignment', async () => {
      await service.getBoardIssues();
      expect(mockGetIssuesForBoard).toHaveBeenCalledTimes(1);

      await service.assignIssue('PROJ-123', 'user@example.com');

      const issues = await service.getBoardIssues();
      expect(issues).toBeDefined();
      expect(mockGetIssuesForBoard).toHaveBeenCalledTimes(2); // Called again after cache invalidation
    });
  });

  describe('startPolling', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
      service.stopPolling();
    });

    it('should start polling at specified interval', async () => {
      const callback = jest.fn();
      service.startPolling(callback, 100);

      expect(service.isPolling()).toBe(true);

      // Wait for initial immediate poll to complete (microtasks)
      await Promise.resolve();
      await Promise.resolve();
      expect(callback).toHaveBeenCalledTimes(1);

      service.stopPolling();
    });

    it('should invoke callback on each poll', async () => {
      const callback = jest.fn();
      service.startPolling(callback, 50);

      // Wait for initial immediate poll
      await Promise.resolve();
      await Promise.resolve();
      expect(callback).toHaveBeenCalledTimes(1);

      // Advance time to trigger next poll
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      await Promise.resolve();
      expect(callback).toHaveBeenCalledTimes(2);

      // Advance time to trigger another poll
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      await Promise.resolve();
      expect(callback).toHaveBeenCalledTimes(3);

      service.stopPolling();
    });
  });

  describe('stopPolling', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should stop polling', async () => {
      const callback = jest.fn();
      service.startPolling(callback, 100);

      // Wait for initial immediate poll
      await Promise.resolve();
      await Promise.resolve();
      expect(callback).toHaveBeenCalledTimes(1);

      service.stopPolling();
      expect(service.isPolling()).toBe(false);

      // Advance time and verify callback is not called again
      jest.advanceTimersByTime(200);
      await Promise.resolve();
      await Promise.resolve();
      expect(callback).toHaveBeenCalledTimes(1); // Still 1, not called again
    });
  });

  describe('invalidateCache', () => {
    it('should clear cached issues', async () => {
      await service.getBoardIssues();
      service.invalidateCache();

      // Next call should fetch fresh data
      const issues = await service.getBoardIssues();
      expect(issues).toBeDefined();
    });
  });
});
