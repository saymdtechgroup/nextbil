import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Delete leftover variables and logic
content = re.sub(
    r'    let distributeAmount = 0;.*?// Record Transaction in PostgreSQL Backend',
    '    // Record Transaction in PostgreSQL Backend',
    content, flags=re.DOTALL
)

# Also delete setTransactions and local transaction storage logic from the bottom of handleConfirmPurchase
content = re.sub(
    r'    // Record Transaction History\s*const newTx: Transaction = \{.*?\};\s*const updatedTxs = \[newTx, \.\.\.transactions\];\s*setTransactions\(updatedTxs\);\s*if \(typeof window !== \'undefined\'\) \{\s*localStorage\.setItem\(\'nxbc_transactions\', JSON\.stringify\(updatedTxs\)\);\s*\}',
    '    // (Transactions are now synced from server)',
    content, flags=re.DOTALL
)

with open("src/App.tsx", "w") as f:
    f.write(content)
print("Cleaned up remaining local mutations")
