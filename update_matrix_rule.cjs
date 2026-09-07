const fs = require('fs');

let app = fs.readFileSync('src/App.tsx', 'utf8');

const targetLogic = `    // MLM Distribution Logic based on Cumulative Investment:
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
      const totalBonus = directBonus + l1Bonus;

      const newClaimable = claimableBalanceUsd + totalBonus;
      const newLevel = levelIncomeUsd + totalBonus;
      setClaimableBalanceUsd(newClaimable);
      setLevelIncomeUsd(newLevel);
      if (typeof window !== 'undefined') {
        localStorage.setItem('nxbc_claimable_usd', newClaimable.toString());
        localStorage.setItem('nxbc_level_income', newLevel.toString());
      }
    }`;

const updatedLogic = `    // 1. Level / Direct MLM Distribution Logic ($100 default limit)
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
    }

    // Apply accumulated bonuses safely using state updater functions
    if (earnedLevelBonus > 0 || earnedMatrixBonus > 0) {
      const totalEarned = earnedLevelBonus + earnedMatrixBonus;
      
      setClaimableBalanceUsd(prev => {
         const next = prev + totalEarned;
         if (typeof window !== 'undefined') localStorage.setItem('nxbc_claimable_usd', next.toString());
         return next;
      });
      
      if (earnedLevelBonus > 0) {
         setLevelIncomeUsd(prev => {
            const next = prev + earnedLevelBonus;
            if (typeof window !== 'undefined') localStorage.setItem('nxbc_level_income', next.toString());
            return next;
         });
      }
      
      if (earnedMatrixBonus > 0) {
         setMatrixIncomeUsd(prev => {
            const next = prev + earnedMatrixBonus;
            if (typeof window !== 'undefined') localStorage.setItem('nxbc_matrix_income', next.toString());
            return next;
         });
      }
    }`;

app = app.replace(targetLogic, updatedLogic);
fs.writeFileSync('src/App.tsx', app);
