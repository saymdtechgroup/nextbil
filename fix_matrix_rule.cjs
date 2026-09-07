const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

const targetLogic = `    // 1. Level / Direct MLM Distribution Logic ($100 default limit)
    const minQualify = systemConfig.minMlmQualifyUsd || 100;
    const wasQualified = totalInvestedUsd >= minQualify;
    const isNowQualified = newTotalInvested >= minQualify;
    
    let distributeAmount = 0;
    if (!wasQualified && isNowQualified) {
      distributeAmount = newTotalInvested;
    } else if (wasQualified) {
      distributeAmount = usdAmount;
    }

    let earnedLevelBonus = 0;
    if (distributeAmount > 0) {
      const directBonus = (distributeAmount * systemConfig.directSponsorPercent) / 100;
      const l1Bonus = (distributeAmount * (referralLevels[0]?.commissionPercent || 10)) / 100;
      earnedLevelBonus = directBonus + l1Bonus;
    }

    // 2. Matrix Team-Wise Logic ($10 Qualification limit)
    const minMatrixQualify = 10;
    const wasMatrixQualified = totalInvestedUsd >= minMatrixQualify;
    const isNowMatrixQualified = newTotalInvested >= minMatrixQualify;
    
    let earnedMatrixBonus = 0;
    // Placement happens only ONCE when they cross $10 threshold
    if (!wasMatrixQualified && isNowMatrixQualified && systemConfig.matrixConfig?.enabled) {
       earnedMatrixBonus = systemConfig.matrixConfig.placementIncomeUsd || 1.00;
       console.log('User placed in Team Matrix! Earned Matrix Bonus:', earnedMatrixBonus);
    }`;

const updatedLogic = `    // UNIVERSAL MLM Qualification Logic (Default $100 limit applies to Level, Direct, Matrix, Ranks)
    const minQualify = systemConfig.minMlmQualifyUsd || 100;
    const wasQualified = totalInvestedUsd >= minQualify;
    const isNowQualified = newTotalInvested >= minQualify;
    
    let distributeAmount = 0;
    let earnedLevelBonus = 0;
    let earnedMatrixBonus = 0;

    if (!wasQualified && isNowQualified) {
      // User just crossed the qualification threshold (e.g. $100).
      distributeAmount = newTotalInvested;
      
      // Matrix Placement happens ONLY ONCE when they fully qualify
      if (systemConfig.matrixConfig?.enabled) {
         earnedMatrixBonus = systemConfig.matrixConfig.placementIncomeUsd || 1.00;
         console.log('User placed in Team Matrix! Earned Matrix Bonus:', earnedMatrixBonus);
      }
    } else if (wasQualified) {
      // User was already qualified. Distribute on the new top-up amount.
      distributeAmount = usdAmount;
    }

    // Distribute Direct & Level Bonuses
    if (distributeAmount > 0) {
      const directBonus = (distributeAmount * systemConfig.directSponsorPercent) / 100;
      const l1Bonus = (distributeAmount * (referralLevels[0]?.commissionPercent || 10)) / 100;
      earnedLevelBonus = directBonus + l1Bonus;
    }`;

if (app.includes(targetLogic)) {
  app = app.replace(targetLogic, updatedLogic);
  fs.writeFileSync('src/App.tsx', app);
  console.log('Successfully updated MLM & Matrix rules.');
} else {
  console.log('Target logic not found.');
}
