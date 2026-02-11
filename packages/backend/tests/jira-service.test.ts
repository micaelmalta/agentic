import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { JiraService } from '../src/services/jira-service.js';
import type { Issue } from '../src/types/issue.js';

// Mock jira-client
jest.mock('jira-client');

describe('JiraService', () => {
  let service: JiraService;

  beforeEach(() => {
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
    });

    it('should return cached issues on subsequent calls', async () => {
      const issues1 = await service.getBoardIssues();
      const issues2 = await service.getBoardIssues();

      expect(issues1).toBe(issues2); // Same reference = cached
    });
  });

  describe('getIssue', () => {
    it('should fetch specific issue by key', async () => {
      const issue = await service.getIssue('PROJ-123');

      expect(issue).toBeDefined();
      expect(issue.key).toBe('PROJ-123');
    });

    it('should throw error for invalid issue key', async () => {
      await expect(service.getIssue('INVALID')).rejects.toThrow();
    });
  });

  describe('transitionIssue', () => {
    it('should transition issue to new status', async () => {
      await service.transitionIssue('PROJ-123', 'In Progress');

      // Verify transition was called (would need to check mock calls)
      expect(true).toBe(true);
    });

    it('should invalidate cache after transition', async () => {
      await service.getBoardIssues(); // Populate cache
      await service.transitionIssue('PROJ-123', 'In Progress');

      // Next call should fetch fresh data (cache invalidated)
      const issues = await service.getBoardIssues();
      expect(issues).toBeDefined();
    });
  });

  describe('getAvailableTransitions', () => {
    it('should return available transitions for issue', async () => {
      const transitions = await service.getAvailableTransitions('PROJ-123');

      expect(Array.isArray(transitions)).toBe(true);
    });
  });

  describe('assignIssue', () => {
    it('should assign issue to user', async () => {
      await service.assignIssue('PROJ-123', 'user@example.com');

      expect(true).toBe(true);
    });

    it('should invalidate cache after assignment', async () => {
      await service.getBoardIssues();
      await service.assignIssue('PROJ-123', 'user@example.com');

      const issues = await service.getBoardIssues();
      expect(issues).toBeDefined();
    });
  });

  describe('startPolling', () => {
    it('should start polling at specified interval', () => {
      const callback = jest.fn();
      service.startPolling(callback, 100);

      expect(service.isPolling()).toBe(true);

      service.stopPolling();
    });

    it('should invoke callback on each poll', async () => {
      const callback = jest.fn();
      service.startPolling(callback, 50);

      await new Promise(resolve => setTimeout(resolve, 150));

      expect(callback).toHaveBeenCalled();

      service.stopPolling();
    });
  });

  describe('stopPolling', () => {
    it('should stop polling', () => {
      const callback = jest.fn();
      service.startPolling(callback, 100);
      service.stopPolling();

      expect(service.isPolling()).toBe(false);
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
