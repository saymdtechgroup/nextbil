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
  onResetToDefaults: () => void;
  onExitAdmin: () => void;
}`;

if (admin.includes(targetProps)) {
  admin = admin.replace(targetProps, updatedProps);
  console.log("Props updated");
}

const targetImports = `} from '../types/crypto';`;
const updatedImports = `  QueueEntry,
} from '../types/crypto';`;

if (admin.includes(targetImports) && !admin.includes("QueueEntry,")) {
  admin = admin.replace(targetImports, updatedImports);
  console.log("Imports updated");
}

const targetDestruct = `  onUpdateMatrixConfig,
  onResetToDefaults,
  onExitAdmin,
}: SecretAdminPageProps) => {`;
const updatedDestruct = `  onUpdateMatrixConfig,
  sellQueue = [],
  onUpdateSellQueue,
  onResetToDefaults,
  onExitAdmin,
}: SecretAdminPageProps) => {`;

if (admin.includes(targetDestruct)) {
  admin = admin.replace(targetDestruct, updatedDestruct);
  console.log("Destruct updated");
}

const targetTabsType = `type AdminTab = 'security' | 'phases' | 'mlm' | 'matrix' | 'system' | 'ranks' | 'database';`;
const updatedTabsType = `type AdminTab = 'security' | 'phases' | 'mlm' | 'matrix' | 'system' | 'ranks' | 'queue' | 'database';`;

if (admin.includes(targetTabsType)) {
  admin = admin.replace(targetTabsType, updatedTabsType);
  console.log("Tabs type updated");
}

const targetTabButton = `<TabButton id="database" icon={Database} label="Database Sync" />`;
const updatedTabButton = `<TabButton id="queue" icon={Layers} label="Queue (FIFO)" />
              <TabButton id="database" icon={Database} label="Database Sync" />`;

if (admin.includes(targetTabButton)) {
  admin = admin.replace(targetTabButton, updatedTabButton);
  console.log("Tab button updated");
}

fs.writeFileSync('src/components/SecretAdminPage.tsx', admin);
