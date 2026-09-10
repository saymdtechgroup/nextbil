import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Fix setClaimableIncomeUsd
content = content.replace("setClaimableIncomeUsd(", "setClaimableBalanceUsd(")

# Insert allocation
allocation_state = """
  const [allocation, setAllocation] = useState<AllocationState>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('nxbc_user_allocation');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {}
      }
    }
    return {
      p2Percent: 0,
      p3Percent: 0,
      p4Percent: 0,
      p5Percent: 0,
      dexPercent: 0,
      unallocatedPercent: 100,
      totalTokensPurchased: 0,
      isLocked: false,
    };
  });
"""

if "const [allocation, setAllocation]" not in content:
    content = content.replace("const [transactions, setTransactions]", allocation_state + "\n  const [transactions, setTransactions]")

# Fix newTotalInvested in handleConfirmPurchase
# It seems newTotalInvested was used but not defined since we removed the calculation
# The error says: src/App.tsx(749,28): error TS2304: Cannot find name 'newTotalInvested'.
# Let's define newTotalInvested in handleConfirmPurchase
content = content.replace(
    "const minQualify = systemConfig.minMlmQualifyUsd || 100;",
    "const minQualify = systemConfig.minMlmQualifyUsd || 100;\n    const newTotalInvested = totalInvestedUsd + usdAmount;"
)

with open("src/App.tsx", "w") as f:
    f.write(content)
print("Fixed missing state")
