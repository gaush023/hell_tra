// Test leaderboard functionality
const { UserService } = require('./dist/services/UserService');
const { DatabaseService } = require('./dist/database/DatabaseService');

async function testLeaderboard() {
  console.log('🏆 Leaderboard機能をテストします...\n');

  const db = DatabaseService.getInstance();
  await db.initialize();
  const userService = new UserService();

  // Test overall leaderboard
  console.log('📊 全体のリーダーボードを取得します...');
  const overallLeaderboard = userService.getLeaderboard(undefined, 10);
  console.log(`✅ ${overallLeaderboard.length}件のエントリーを取得`);
  overallLeaderboard.forEach((entry, index) => {
    console.log(`  ${index + 1}. ${entry.user.username} - 勝率: ${entry.stats.winRate.toFixed(1)}%, 勝利数: ${entry.stats.wins}`);
  });

  // Test Pong leaderboard
  console.log('\n🏓 Pongリーダーボードを取得します...');
  const pongLeaderboard = userService.getLeaderboard('pong', 10);
  console.log(`✅ ${pongLeaderboard.length}件のエントリーを取得`);
  pongLeaderboard.forEach((entry, index) => {
    console.log(`  ${index + 1}. ${entry.user.username} - 勝率: ${entry.stats.pongStats.winRate.toFixed(1)}%, 勝利数: ${entry.stats.pongStats.wins}`);
  });

  // Test Tank leaderboard
  console.log('\n🚗 Tankリーダーボードを取得します...');
  const tankLeaderboard = userService.getLeaderboard('tank', 10);
  console.log(`✅ ${tankLeaderboard.length}件のエントリーを取得`);
  tankLeaderboard.forEach((entry, index) => {
    console.log(`  ${index + 1}. ${entry.user.username} - 勝率: ${entry.stats.tankStats.winRate.toFixed(1)}%, 勝利数: ${entry.stats.tankStats.wins}`);
  });

  console.log('\n🎉 Leaderboardテスト完了！');
}

testLeaderboard().catch(console.error);
