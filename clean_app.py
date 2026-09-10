import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Replace setPhases initializer
content = re.sub(
    r'const \[phases, setPhases\] = useState<PhaseConfig\[\]>\(\(\) => \{.*?\n  \}\);',
    'const [phases, setPhases] = useState<PhaseConfig[]>([]);',
    content, flags=re.DOTALL
)

# Replace setSystemConfig initializer
content = re.sub(
    r'const \[systemConfig, setSystemConfig\] = useState<AdminSystemConfig>\(\(\) => \{.*?\n  \}\);',
    r"""const [systemConfig, setSystemConfig] = useState<AdminSystemConfig>({
    tokenName: 'NXBC',
    tokenSymbol: 'NXBC',
    contractAddress: '0x8eF229597756a7bfb7Da80c0d86596D7bD366007',
    receivingAddress: '0x8d1abCa8Cf0f42799b9a76254710e979bd59c261',
    minPurchaseUsd: 0.01,
    maxPurchaseUsd: 50000,
    minMlmQualifyUsd: 100,
    presalePaused: false,
    directSponsorPercent: 10,
    withdrawalFeePercent: 2,
  });""",
    content, flags=re.DOTALL
)

# Replace totalInvestedUsd
content = re.sub(
    r'const \[totalInvestedUsd, setTotalInvestedUsd\] = useState<number>\(\(\) => \{[^\}]+\}\);',
    'const [totalInvestedUsd, setTotalInvestedUsd] = useState<number>(0);',
    content, flags=re.DOTALL
)

# Replace claimableIncomeUsd
content = re.sub(
    r'const \[claimableIncomeUsd, setClaimableIncomeUsd\] = useState<number>\(\(\) => \{[^\}]+\}\);',
    'const [claimableIncomeUsd, setClaimableIncomeUsd] = useState<number>(0);',
    content, flags=re.DOTALL
)

# Replace matrixIncomeUsd
content = re.sub(
    r'const \[matrixIncomeUsd, setMatrixIncomeUsd\] = useState<number>\(\(\) => \{[^\}]+\}\);',
    'const [matrixIncomeUsd, setMatrixIncomeUsd] = useState<number>(0);',
    content, flags=re.DOTALL
)

# Replace transactions
content = re.sub(
    r'const \[transactions, setTransactions\] = useState<Transaction\[\]>\(\(\) => \{[^\}]+\}\);',
    'const [transactions, setTransactions] = useState<Transaction[]>([]);',
    content, flags=re.DOTALL
)

with open("src/App.tsx", "w") as f:
    f.write(content)
print("Cleaned App initializers")
