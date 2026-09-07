const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /const defaultRankRewards: RankReward\[\] = \[([\s\S]*?)\];/;
const match = app.match(regex);

if (match) {
  const updatedRanks = `const defaultRankRewards: RankReward[] = [
    {
      id: 'rank-1',
      rankNumber: 1,
      name: 'Team Development Fund',
      requiredDirectVolume: 50000,
      requiredTeamVolume: 0,
      requiredDirects: 0,
      rewardType: 'fund',
      rewardTitle: '$100 Team Development Fund',
      oneTimeBonusUsd: 100,
      rewardTokens: 0,
      monthlyRoyaltyPercent: 0,
      currentQualifiedCount: 0,
      status: 'locked',
    },
    {
      id: 'rank-2',
      rankNumber: 2,
      name: 'Monthly Leadership Salary',
      requiredDirectVolume: 100000,
      requiredTeamVolume: 0,
      requiredDirects: 0,
      rewardType: 'salary',
      rewardTitle: '$100 / Month (12 Months Salary)',
      oneTimeBonusUsd: 1200,
      rewardTokens: 0,
      monthlyRoyaltyPercent: 0,
      currentQualifiedCount: 0,
      status: 'locked',
    },
    {
      id: 'rank-3',
      rankNumber: 3,
      name: 'Travel Tour Fund',
      requiredDirectVolume: 100000,
      requiredTeamVolume: 150000,
      requiredDirects: 0,
      rewardType: 'fund',
      rewardTitle: '$500 International Travel Fund',
      oneTimeBonusUsd: 500,
      rewardTokens: 0,
      monthlyRoyaltyPercent: 0,
      currentQualifiedCount: 0,
      status: 'locked',
    },
    {
      id: 'rank-4',
      rankNumber: 4,
      name: 'Dream Car Fund',
      requiredDirectVolume: 100000,
      requiredTeamVolume: 2000000,
      requiredDirects: 0,
      rewardType: 'fund',
      rewardTitle: 'Dream Car Fund ($50,000 USD Value)',
      oneTimeBonusUsd: 50000,
      rewardTokens: 0,
      monthlyRoyaltyPercent: 0,
      currentQualifiedCount: 0,
      status: 'locked',
    },
    {
      id: 'rank-5',
      rankNumber: 5,
      name: 'Luxury House Fund',
      requiredDirectVolume: 100000,
      requiredTeamVolume: 5000000,
      requiredDirects: 0,
      rewardType: 'fund',
      rewardTitle: 'Luxury House Fund ($100,000 USD Value)',
      oneTimeBonusUsd: 100000,
      rewardTokens: 0,
      monthlyRoyaltyPercent: 0,
      currentQualifiedCount: 0,
      status: 'locked',
    },
  ];`;
  
  app = app.replace(match[0], updatedRanks);
  fs.writeFileSync('src/App.tsx', app);
  console.log('Ranks updated!');
} else {
  console.log('Could not match ranks array');
}
