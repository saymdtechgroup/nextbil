const fs = require('fs');

let app = fs.readFileSync('src/App.tsx', 'utf8');

const targetLogic = `    // $100 Cumulative Qualification Rule Check:
    // Only distribute / credit MLM referral commissions if user meets the cumulative threshold ($100 default)
    const minQualify = systemConfig.minMlmQualifyUsd || 100;
    const isNowQualified = newTotalInvested >= minQualify;
    if (isNowQualified) {
      // Credit direct sponsor and level 1 bonuses based on Admin dynamic percentages`;

const updatedLogic = `    // $100 Cumulative Qualification Rule Check:
    // 1. Sponsor must be qualified (newTotalInvested >= 100)
    // 2. The amount being invested right now MUST also be at least $100 (minQualify) for distribution to happen
    const minQualify = systemConfig.minMlmQualifyUsd || 100;
    const isNowQualified = newTotalInvested >= minQualify;
    const isAmountEligibleForMlm = usdAmount >= minQualify;
    
    if (isNowQualified && isAmountEligibleForMlm) {
      // Credit direct sponsor and level 1 bonuses based on Admin dynamic percentages`;

app = app.replace(targetLogic, updatedLogic);
fs.writeFileSync('src/App.tsx', app);
