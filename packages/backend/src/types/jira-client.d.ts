declare module 'jira-client' {
  export default class JiraClient {
    constructor(config: any);
    getIssuesForBoard(boardId: string): Promise<any>;
    findIssue(issueKey: string): Promise<any>;
    listTransitions(issueKey: string): Promise<any>;
    transitionIssue(issueKey: string, transition: any): Promise<any>;
    updateIssue(issueKey: string, update: any): Promise<any>;
  }
}
