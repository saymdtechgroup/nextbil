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
      requiredDirectVolume: 2000,
      requiredTeamVolume: 3000,
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
      name: 'Charity Fund',
      requiredDirectVolume: 50000,
      requiredTeamVolume: 50000,
      requiredDirects: 0,
      rewardType: 'fund',
      rewardTitle: '$500 Charity Fund',
      oneTimeBonusUsd: 500,
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
  
  // Force override localStorage so user sees it immediately
  app = app.replace(
    /const \[rankRewards, setRankRewards\] = useState<RankReward\[\]>\(\(\) => {[\s\S]*?return defaultRankRewards;\s*}\);/,
    `const [rankRewards, setRankRewards] = useState<RankReward[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nxbc_admin_ranks');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed?.[0]?.requiredDirectVolume === 50000 || parsed?.[1]?.name === 'Monthly Leadership Salary') {
             localStorage.setItem('nxbc_admin_ranks', JSON.stringify(defaultRankRewards));
             return defaultRankRewards;
          }
          return parsed;
        } catch (e) {}
      }
    }
    return defaultRankRewards;
  });`
  );
  
  fs.writeFileSync('src/App.tsx', app);
  console.log('Ranks updated again!');
} else {
  console.log('Could not match ranks array');
}
