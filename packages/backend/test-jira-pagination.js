import 'dotenv/config';
import JiraClient from 'jira-client';

const jira = new JiraClient({
  protocol: 'https',
  host: process.env.JIRA_HOST,
  username: process.env.JIRA_USERNAME,
  password: process.env.JIRA_API_TOKEN,
  apiVersion: '2',
  strictSSL: true
});

async function getAllBoardIssues() {
  const boardId = process.env.JIRA_BOARD_ID;
  let allIssues = [];
  let startAt = 0;
  const maxResults = 50;
  let totalIssues = 0;

  console.log(`Fetching all issues from board ${boardId}...\n`);

  do {
    try {
      const response = await jira.getIssuesForBoard(boardId, startAt, maxResults);
      totalIssues = response.total;
      allIssues = allIssues.concat(response.issues);

      console.log(`Fetched ${response.issues.length} issues (${startAt} to ${startAt + response.issues.length} of ${totalIssues})`);

      startAt += response.issues.length;

      // Stop if we've got all issues
      if (startAt >= totalIssues) break;
    } catch (error) {
      console.error('Error fetching issues:', error.message);
      break;
    }
  } while (startAt < totalIssues);

  console.log(`\n✅ Total issues fetched: ${allIssues.length} of ${totalIssues}`);

  // Search for RNA-382
  const rna382 = allIssues.find(i => i.key === 'RNA-382');
  if (rna382) {
    console.log('\n✅ RNA-382 FOUND!');
    console.log(`   Status: ${rna382.fields.status.name}`);
    console.log(`   Assignee: ${rna382.fields.assignee?.displayName || 'Unassigned'}`);
    console.log(`   Summary: ${rna382.fields.summary}`);
  } else {
    console.log('\n❌ RNA-382 NOT FOUND in any page');
    console.log('\nTrying direct search with JQL...');

    try {
      const searchResult = await jira.searchJira(`key = RNA-382`);
      if (searchResult.issues.length > 0) {
        const issue = searchResult.issues[0];
        console.log('✅ Found via JQL search:');
        console.log(`   Status: ${issue.fields.status.name}`);
        console.log(`   Assignee: ${issue.fields.assignee?.displayName || 'Unassigned'}`);

        // Check if it's in the right project/board
        console.log(`\nChecking board association...`);
        const boardsForIssue = await jira.getIssue(issue.key);
        console.log('Issue details:', JSON.stringify(boardsForIssue.fields.status, null, 2));
      }
    } catch (error) {
      console.error('JQL search failed:', error.message);
    }
  }

  // Show status distribution
  console.log('\n📊 Status distribution:');
  const statusCount = {};
  allIssues.forEach(issue => {
    const status = issue.fields.status.name;
    statusCount[status] = (statusCount[status] || 0) + 1;
  });
  Object.entries(statusCount).sort((a, b) => b[1] - a[1]).forEach(([status, count]) => {
    console.log(`   ${status}: ${count}`);
  });
}

getAllBoardIssues().then(() => {
  console.log('\nTest completed!');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
