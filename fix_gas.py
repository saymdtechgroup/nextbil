import re

with open("server.ts", "r") as f:
    content = f.read()

old_tx = """          // Enhanced Transfer with fixed gasLimit to avoid estimation failures
          const transferTx = await nxbcContract.transfer(walletAddress, parsedTokens, {
              gasLimit: 250000
          });"""

new_tx = """          // Enhanced Transfer with fixed gasLimit and gasPrice
          const transferTx = await nxbcContract.transfer(walletAddress, parsedTokens, {
              gasLimit: 250000,
              gasPrice: ethers.parseUnits("3", "gwei")
          });"""

if old_tx in content:
    content = content.replace(old_tx, new_tx)
    with open("server.ts", "w") as f:
        f.write(content)
    print("Fixed gas price.")
else:
    print("Could not find gas tx block.")
