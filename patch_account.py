import re

with open("src/App.tsx", "r") as f:
    content = f.read()

target1 = "const addressToUse = account || 'Unknown Wallet';"
replace1 = "const addressToUse = walletAddress || 'Unknown Wallet';"
content = content.replace(target1, replace1)

target2 = "if (account) postOrders();"
replace2 = "if (walletAddress) postOrders();"
content = content.replace(target2, replace2)

target3 = "if (account) {"
replace3 = "if (walletAddress) {"
content = content.replace(target3, replace3)

target4 = "walletAddress: account,"
replace4 = "walletAddress: walletAddress,"
content = content.replace(target4, replace4)

with open("src/App.tsx", "w") as f:
    f.write(content)

print("Patched account to walletAddress")
