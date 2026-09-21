const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const files = [
  path.join(root, 'src', 'App.tsx'),
  path.join(root, 'src', 'main.tsx'),
  path.join(root, 'src', 'utils', 'web3Helper.ts'),
  path.join(root, 'server.ts'),
];

const forbidden = [
  'NXBC-DASHBOARD-V1',
  'authenticateDashboardWallet',
  'nxbc_user_auth_token',
];

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  for (const term of forbidden) {
    if (text.includes(term)) {
      console.error(`FAIL: dashboard-signature marker found: ${term} in ${path.relative(root, file)}`);
      process.exit(1);
    }
  }
}

const helper = fs.readFileSync(path.join(root, 'src', 'utils', 'web3Helper.ts'), 'utf8');
if (!helper.includes('signWithdrawRequest') || !helper.includes('signer.signMessage(message)')) {
  console.error('FAIL: withdrawal wallet-signature authorization was not found.');
  process.exit(1);
}

console.log('PASS: no automatic dashboard signature flow found; withdrawal signature authorization remains present.');
