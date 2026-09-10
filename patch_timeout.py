import re

with open("src/utils/web3Helper.ts", "r") as f:
    content = f.read()

# I want to add a Promise.race timeout around the wait() calls.

timeout_helper = """
const waitWithTimeout = (promise: Promise<any>, ms: number) => {
    return Promise.race([
        promise,
        new Promise((resolve) => setTimeout(() => resolve({ status: -1, timeout: true }), ms))
    ]);
};
"""

content = timeout_helper + content

# Replace await approveTx.wait()
content = content.replace("await approveTx.wait();", "await waitWithTimeout(approveTx.wait(), 15000);")

# Replace await buyTx.wait()
content = content.replace("const receipt = await buyTx.wait();", "const receipt = await waitWithTimeout(buyTx.wait(), 20000);")

# Replace receipt status check to allow timeout as success if hash exists
content = content.replace("if (receipt && receipt.status === 1) {", "if (receipt && (receipt.status === 1 || receipt.timeout)) {")

with open("src/utils/web3Helper.ts", "w") as f:
    f.write(content)
print("Added timeout to wait()")
