import 'dotenv/config';
import JiraClient from 'jira-client';

console.log('Testing Jira API connection...\n');

const config = {
  protocol: 'https',
  host: process.env.JIRA_HOST,
  username: process.env.JIRA_USERNAME,
  password: process.env.JIRA_API_TOKEN,
  apiVersion: '2',
  strictSSL: true
};

console.log('Configuration:');
console.log(`  Host: ${config.host}`);
console.log(`  Username: ${config.username}`);
console.log(`  API Token: ${config.password ? config.password.substring(0, 10) + '...' : 'NOT SET'}`);
console.log(`  Board ID: ${process.env.JIRA_BOARD_ID}\n`);

const jira = new JiraClient(config);

async function testConnection() {
  console.log('Test 1: Get current user...');
  try {
    const user = await jira.getCurrentUser();
    console.log('✅ Success! Current user:', user.displayName);
  } catch (error) {
    console.log('❌ Failed:', error.message);
    return;
  }

  console.log('\nTest 2: Search for issue RNA-382...');
  try {
    const issue = await jira.findIssue('RNA-382');
    console.log('✅ Success! Found issue:');
    console.log(`  Key: ${issue.key}`);
    console.log(`  Summary: ${issue.fields.summary}`);
    console.log(`  Status: ${issue.fields.status.name}`);
  } catch (error) {
    console.log('❌ Failed:', error.message);
  }

  console.log('\nTest 3: Get board issues (Board ID: ' + process.env.JIRA_BOARD_ID + ')...');
  try {
    const response = await jira.getIssuesForBoard(process.env.JIRA_BOARD_ID);
    console.log(`✅ Success! Found ${response.issues.length} issues on board`);

    // Check if RNA-382 is in the results
    const rna382 = response.issues.find(i => i.key === 'RNA-382');
    if (rna382) {
      console.log('  ✅ RNA-382 found in board issues');
      console.log(`     Status: ${rna382.fields.status.name}`);
    } else {
      console.log('  ⚠️  RNA-382 NOT found in board issues');
    }

    // Show first 5 issues
    console.log('\n  First 5 issues:');
    response.issues.slice(0, 5).forEach(issue => {
      console.log(`    - ${issue.key}: ${issue.fields.status.name}`);
    });
  } catch (error) {
    console.log('❌ Failed:', error.message);
    console.log('Error details:', error);
  }

  console.log('\nTest 4: Get issue transitions for RNA-382...');
  try {
    const transitions = await jira.listTransitions('RNA-382');
    console.log(`✅ Success! Available transitions:`);
    transitions.transitions.forEach(t => {
      console.log(`    - ${t.name} (id: ${t.id}) -> ${t.to.name}`);
    });
  } catch (error) {
    console.log('❌ Failed:', error.message);
  }
}

testConnection().then(() => {
  console.log('\nTests completed!');
  process.exit(0);
}).catch(error => {
  console.error('\nFatal error:', error);
  process.exit(1);
});
