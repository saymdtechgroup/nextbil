import re

with open("src/utils/web3Helper.ts", "r") as f:
    content = f.read()

# Make the wait for transaction non-blocking or at least have a timeout and better error handling
target = """    onStatusUpdate(`Waiting for block confirmation...`);
    const receipt = await buyTx.wait();
    
    if (receipt && receipt.status === 1) {
      return { success: true, txHash: receipt.hash };
    } else {
      return { success: false, error: 'Transaction reverted on BSC.' };
    }
  } catch (err: any) {
    console.error("Smart Contract Buy Error:", err);
    return { success: false, error: err?.reason || err?.message || 'Transaction failed or rejected by user' };
  }"""

replace = """    onStatusUpdate(`Waiting for block confirmation...`);
    
    // Instead of waiting indefinitely and blocking the UI, we race it with a timeout
    // Or we simply return the hash immediately and let the server handle fulfillment (optimistic)
    // For now we will just wait with a 15-second timeout to prevent UI freeze
    
    const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Transaction confirmation timed out. It might still be processing on the blockchain.')), 15000)
    );
    
    try {
        const receipt: any = await Promise.race([buyTx.wait(), timeoutPromise]);
        if (receipt && receipt.status === 1) {
          return { success: true, txHash: receipt.hash };
        } else {
          return { success: false, error: 'Transaction reverted on BSC.' };
        }
    } catch (waitErr: any) {
        // If it timed out but we have a hash, we can consider it "broadcasted"
        // and optimistic UI will proceed
        if (waitErr.message.includes('timed out') && buyTx.hash) {
            return { success: true, txHash: buyTx.hash };
        }
        throw waitErr;
    }

  } catch (err: any) {
    console.error("Smart Contract Buy Error:", err);
    return { success: false, error: err?.reason || err?.message || 'Transaction failed or rejected by user' };
  }"""

content = content.replace(target, replace)

with open("src/utils/web3Helper.ts", "w") as f:
    f.write(content)
print("Patched web3Helper.ts")
