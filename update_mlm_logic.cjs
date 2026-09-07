const fs = require('fs');

let app = fs.readFileSync('src/App.tsx', 'utf8');

const targetLogic = `    // $100 Cumulative Qualification Rule Check:
    // 1. Sponsor must be qualified
    // 2. The amount being invested right now MUST also be at least $100 for distribution
    const minQualify = systemConfig.minMlmQualifyUsd || 100;
    const isNowQualified = newTotalInvested >= minQualify;
    const isAmountEligibleForMlm = usdAmount >= minQualify;
    
    if (isNowQualified && isAmountEligibleForMlm) {
      // Credit direct sponsor and level 1 bonuses based on Admin dynamic percentages
      const directBonus = (usdAmount * systemConfig.directSponsorPercent) / 100;
      const l1Bonus = (usdAmount * (referralLevels[0]?.commissionPercent || 10)) / 100;
      const totalBonus = directBonus + l1Bonus;`;

const updatedLogic = `    // MLM Distribution Logic based on Cumulative Investment:
    const minQualify = systemConfig.minMlmQualifyUsd || 100;
    const wasQualified = totalInvestedUsd >= minQualify;
    const isNowQualified = newTotalInvested >= minQualify;
    
    let distributeAmount = 0;
    if (!wasQualified && isNowQualified) {
      // User just crossed the qualification threshold. Distribute on total accumulated amount.
      distributeAmount = newTotalInvested;
    } else if (wasQualified) {
      // User was already qualified. Distribute on the new top-up amount.
      distributeAmount = usdAmount;
    }

    if (distributeAmount > 0) {
      // Credit direct sponsor and level 1 bonuses based on Admin dynamic percentages
      const directBonus = (distributeAmount * systemConfig.directSponsorPercent) / 100;
      const l1Bonus = (distributeAmount * (referralLevels[0]?.commissionPercent || 10)) / 100;
      const totalBonus = directBonus + l1Bonus;`;

app = app.replace(targetLogic, updatedLogic);
fs.writeFileSync('src/App.tsx', app);
