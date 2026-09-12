import re

with open("server.ts", "r") as f:
    content = f.read()

replacement = """      const rpcUrl = process.env.RPC_URL || "https://bsc-dataseed.binance.org/";
      
      let dynamicContractAddress = "0x8eF229597756a7bfb7Da80c0d86596D7bD366007";
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
      } catch (err) {}
      
      const nxbcTokenContractAddress = process.env.NXBC_TOKEN_ADDRESS || dynamicContractAddress;"""

content = content.replace(
"""      const rpcUrl = process.env.RPC_URL || "https://bsc-dataseed.binance.org/";
      const nxbcTokenContractAddress = process.env.NXBC_TOKEN_ADDRESS || "0x8eF229597756a7bfb7Da80c0d86596D7bD366007";""",
    replacement
)

with open("server.ts", "w") as f:
    f.write(content)
print("Fixed server.ts dynamic contract address")
