with open("src/utils/web3Helper.ts", "r") as f:
    content = f.read()

content = content.replace("import { ethers } from \"ethers\";\n// Web3", "};\n\n// Web3")

with open("src/utils/web3Helper.ts", "w") as f:
    f.write(content)
