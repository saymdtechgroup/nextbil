import re

with open("src/utils/web3Helper.ts", "r") as f:
    content = f.read()

# Fix double import and misplaced waitWithTimeout
if "import { ethers } from \"ethers\";\nconst waitWithTimeout" in content:
    content = content.replace(
        "import { ethers } from \"ethers\";\nconst waitWithTimeout = (promise: Promise<any>, ms: number) => {\n    return Promise.race([\n        promise,\n        new Promise((resolve) => setTimeout(() => resolve({ status: -1, timeout: true }), ms))\n    ]);\n};\nimport { ethers } from \"ethers\";",
        "import { ethers } from \"ethers\";\nconst waitWithTimeout = (promise: Promise<any>, ms: number) => {\n    return Promise.race([\n        promise,\n        new Promise((resolve) => setTimeout(() => resolve({ status: -1, timeout: true }), ms))\n    ]);\n};"
    )
    with open("src/utils/web3Helper.ts", "w") as f:
        f.write(content)
    print("Fixed web3Helper.ts structure.")
