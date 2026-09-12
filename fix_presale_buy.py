import re

with open("server.ts", "r") as f:
    content = f.read()

replacement = """
      // Automated On-Chain Token Transfer to User's Web3 Wallet (SafePal / Trust Wallet / MetaMask)
      let tokenDispatchTxHash = "";
      const privateKey = process.env.PAYOUT_HOT_WALLET_PRIVATE_KEY || process.env.SAFEPAL_PRIVATE_KEY;
      const rpcUrl = process.env.RPC_URL || "https://bsc-dataseed.binance.org/";
      
      // Dynamically fetch Contract Address from Database
      let dynamicContractAddress = "0x8eF229597756a7bfb7Da80c0d86596D7bD366007"; // fallback
      try {
        const sysConfigRecord = await db.query.systemConfigs.findFirst({
           where: eq(systemConfigs.key, 'systemConfig')
        });
        if (sysConfigRecord && sysConfigRecord.value) {
           const parsedConfig = JSON.parse(sysConfigRecord.value);
           if (parsedConfig.contractAddress) {
               dynamicContractAddress = parsedConfig.contractAddress;
           }
        }
      } catch (err) {
        console.error("Failed to fetch dynamic contract address", err);
      }
      
      const nxbcTokenContractAddress = process.env.NXBC_TOKEN_ADDRESS || dynamicContractAddress;

      if (privateKey && privateKey.startsWith("0x") && privateKey.length >= 64) {
"""

content = content.replace(
"""      // Automated On-Chain Token Transfer to User's Web3 Wallet (SafePal / Trust Wallet / MetaMask)
      let tokenDispatchTxHash = "";
      const privateKey = process.env.PAYOUT_HOT_WALLET_PRIVATE_KEY || process.env.SAFEPAL_PRIVATE_KEY;
      const rpcUrl = process.env.RPC_URL || "https://bsc-dataseed.binance.org/";
      const nxbcTokenContractAddress = process.env.NXBC_TOKEN_ADDRESS || "0x8eF229597756a7bfb7Da80c0d86596D7bD366007";
      if (privateKey && privateKey.startsWith("0x") && privateKey.length >= 64) {""",
    replacement
)

with open("server.ts", "w") as f:
    f.write(content)
print("Updated server.ts dynamic token dispatch!")
