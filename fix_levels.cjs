const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

const targetLevels = `const defaultPlanLevels: ReferralLevel[] = [
    { level: 1, commissionPercent: 3, directRequirement: 1, directMembers: 0, totalVolumeUsd: 0, earnedUsd: 0 },
    { level: 2, commissionPercent: 2, directRequirement: 2, directMembers: 0, totalVolumeUsd: 0, earnedUsd: 0 },
    { level: 3, commissionPercent: 1, directRequirement: 3, directMembers: 0, totalVolumeUsd: 0, earnedUsd: 0 },
    { level: 4, commissionPercent: 1, directRequirement: 4, directMembers: 0, totalVolumeUsd: 0, earnedUsd: 0 },
    { level: 5, commissionPercent: 0.5, directRequirement: 5, directMembers: 0, totalVolumeUsd: 0, earnedUsd: 0 },
    { level: 6, commissionPercent: 0.5, directRequirement: 6, directMembers: 0, totalVolumeUsd: 0, earnedUsd: 0 },
    { level: 7, commissionPercent: 0.5, directRequirement: 7, directMembers: 0, totalVolumeUsd: 0, earnedUsd: 0 },
    { level: 8, commissionPercent: 0.5, directRequirement: 8, directMembers: 0, totalVolumeUsd: 0, earnedUsd: 0 },
    { level: 9, commissionPercent: 0.5, directRequirement: 9, directMembers: 0, totalVolumeUsd: 0, earnedUsd: 0 },
    { level: 10, commissionPercent: 0.5, directRequirement: 10, directMembers: 0, totalVolumeUsd: 0, earnedUsd: 0 },
  ];`;

const updatedLevels = `const defaultPlanLevels: ReferralLevel[] = [
    { level: 1, commissionPercent: 3, directRequirement: 0, directMembers: 0, totalVolumeUsd: 0, earnedUsd: 0 },
    { level: 2, commissionPercent: 2, directRequirement: 1, directMembers: 0, totalVolumeUsd: 0, earnedUsd: 0 },
    { level: 3, commissionPercent: 1, directRequirement: 1, directMembers: 0, totalVolumeUsd: 0, earnedUsd: 0 },
    { level: 4, commissionPercent: 1, directRequirement: 2, directMembers: 0, totalVolumeUsd: 0, earnedUsd: 0 },
    { level: 5, commissionPercent: 0.5, directRequirement: 2, directMembers: 0, totalVolumeUsd: 0, earnedUsd: 0 },
    { level: 6, commissionPercent: 0.5, directRequirement: 3, directMembers: 0, totalVolumeUsd: 0, earnedUsd: 0 },
    { level: 7, commissionPercent: 0.5, directRequirement: 3, directMembers: 0, totalVolumeUsd: 0, earnedUsd: 0 },
    { level: 8, commissionPercent: 0.5, directRequirement: 3, directMembers: 0, totalVolumeUsd: 0, earnedUsd: 0 },
    { level: 9, commissionPercent: 0.5, directRequirement: 4, directMembers: 0, totalVolumeUsd: 0, earnedUsd: 0 },
    { level: 10, commissionPercent: 0.5, directRequirement: 4, directMembers: 0, totalVolumeUsd: 0, earnedUsd: 0 },
  ];`;

if (app.includes(targetLevels)) {
  app = app.replace(targetLevels, updatedLevels);
  
  // also need to bypass localstorage override check that was resetting it
  app = app.replace(
    `if (parsed?.[0]?.commissionPercent === 10 || parsed?.[1]?.commissionPercent === 5) {`,
    `if (false) {`
  );
  
  fs.writeFileSync('src/App.tsx', app);
  console.log('Levels updated.');
} else {
  console.log('Target levels not found');
}
