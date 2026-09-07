const fs = require('fs');
let admin = fs.readFileSync('src/components/SecretAdminPage.tsx', 'utf8');

const targetProps = `interface SecretAdminPageProps {
  phases: PhaseConfig[];
  referralLevels: ReferralLevel[];
  rankRewards: RankReward[];
  systemConfig: AdminSystemConfig;
  matrixConfig: MatrixConfig;
  onUpdatePhases: (phases: PhaseConfig[]) => void;
  onUpdateReferralLevels: (levels: ReferralLevel[]) => void;
  onUpdateRankRewards: (ranks: RankReward[]) => void;
  onUpdateSystemConfig: (config: AdminSystemConfig) => void;
  onUpdateMatrixConfig: (config: MatrixConfig) => void;
  onSimulateExternalBuy?: (amount: number) => void;
  onResetToDefaults: () => void;
  onExitAdmin: () => void;
}`;

const updatedProps = `interface SecretAdminPageProps {
  phases: PhaseConfig[];
  referralLevels: ReferralLevel[];
  rankRewards: RankReward[];
  systemConfig: AdminSystemConfig;
  matrixConfig: MatrixConfig;
  sellQueue?: QueueEntry[];
  onUpdatePhases: (phases: PhaseConfig[]) => void;
  onUpdateReferralLevels: (levels: ReferralLevel[]) => void;
  onUpdateRankRewards: (ranks: RankReward[]) => void;
  onUpdateSystemConfig: (config: AdminSystemConfig) => void;
  onUpdateMatrixConfig: (config: MatrixConfig) => void;
  onUpdateSellQueue?: (queue: QueueEntry[]) => void;
  onSimulateExternalBuy?: (amount: number) => void;
  onResetToDefaults: () => void;
  onExitAdmin: () => void;
}`;
if(admin.includes(targetProps)) admin = admin.replace(targetProps, updatedProps);

const targetDestruct = `  onUpdateMatrixConfig,
  onSimulateExternalBuy,
  onResetToDefaults,
  onExitAdmin,
}: SecretAdminPageProps) => {`;
const updatedDestruct = `  onUpdateMatrixConfig,
  sellQueue = [],
  onUpdateSellQueue,
  onSimulateExternalBuy,
  onResetToDefaults,
  onExitAdmin,
}: SecretAdminPageProps) => {`;
if(admin.includes(targetDestruct)) admin = admin.replace(targetDestruct, updatedDestruct);

const targetTabs = `type AdminTab = 'security' | 'phases' | 'mlm' | 'matrix' | 'system' | 'ranks' | 'database';`;
const updatedTabs = `type AdminTab = 'security' | 'phases' | 'mlm' | 'matrix' | 'system' | 'ranks' | 'queue' | 'database';`;
if(admin.includes(targetTabs)) admin = admin.replace(targetTabs, updatedTabs);

const targetTabUI = `<TabButton id="database" icon={Database} label="Database Sync" />`;
const updatedTabUI = `<TabButton id="queue" icon={Layers} label="Queue (FIFO)" />
              <TabButton id="database" icon={Database} label="Database Sync" />`;
if(admin.includes(targetTabUI)) admin = admin.replace(targetTabUI, updatedTabUI);

fs.writeFileSync('src/components/SecretAdminPage.tsx', admin);
