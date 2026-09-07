const fs = require('fs');

// 1. Update App.tsx
let app = fs.readFileSync('src/App.tsx', 'utf8');

const targetApp = `<SecretAdminPage
        phases={phases}
        referralLevels={referralLevels}
        rankRewards={rankRewards}
        systemConfig={systemConfig}
        matrixConfig={matrixConfig}
        onUpdatePhases={handleUpdatePhases}
        onUpdateReferralLevels={handleUpdateReferralLevels}
        onUpdateRankRewards={handleUpdateRankRewards}
        onUpdateSystemConfig={handleUpdateSystemConfig}
        onUpdateMatrixConfig={handleUpdateMatrixConfig}
        onResetToDefaults={handleResetToDefaults}
        onExitAdmin={() => {`;

const updatedApp = `<SecretAdminPage
        phases={phases}
        referralLevels={referralLevels}
        rankRewards={rankRewards}
        systemConfig={systemConfig}
        matrixConfig={matrixConfig}
        sellQueue={sellQueue}
        onUpdatePhases={handleUpdatePhases}
        onUpdateReferralLevels={handleUpdateReferralLevels}
        onUpdateRankRewards={handleUpdateRankRewards}
        onUpdateSystemConfig={handleUpdateSystemConfig}
        onUpdateMatrixConfig={handleUpdateMatrixConfig}
        onUpdateSellQueue={(newQueue) => {
          setSellQueue(newQueue);
          if (typeof window !== 'undefined') localStorage.setItem('nxbc_sell_queue', JSON.stringify(newQueue));
        }}
        onResetToDefaults={handleResetToDefaults}
        onExitAdmin={() => {`;

if (app.includes(targetApp)) {
  app = app.replace(targetApp, updatedApp);
  fs.writeFileSync('src/App.tsx', app);
  console.log("App.tsx updated");
} else {
  console.log("Could not find target string in App.tsx");
}
