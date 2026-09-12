import re

with open("server.ts", "r") as f:
    content = f.read()

old_logic = """      if (privateKey && privateKey.startsWith("0x") && privateKey.length >= 64) {
        try {
          const provider = new ethers.JsonRpcProvider(rpcUrl);
          const wallet = new ethers.Wallet(privateKey, provider);
          const nxbcContract = new ethers.Contract(nxbcTokenContractAddress, ERC20_ABI, wallet);
          const parsedTokens = ethers.parseUnits(Number(tokenAmount).toString(), 18);

          console.log(`[TOKEN DISPATCH] Transferring ${tokenAmount} NXBC tokens directly to user wallet ${walletAddress}...`);
          const transferTx = await nxbcContract.transfer(walletAddress, parsedTokens);
          console.log(`[TOKEN DISPATCH] Tokens sent on-chain! TxHash: ${transferTx.hash}`);
          tokenDispatchTxHash = transferTx.hash;
        } catch (dispatchErr: any) {
          console.error("[TOKEN DISPATCH] Automatic token dispatch notice:", dispatchErr?.message);
        }
      }"""

new_logic = """      if (privateKey && privateKey.startsWith("0x") && privateKey.length >= 64) {
        try {
          // Use multiple RPCs for fallback in case Hostinger blocks the default one
          const rpcEndpoints = [
            "https://bsc-dataseed.binance.org/",
            "https://bsc-dataseed1.defibit.io/",
            "https://bsc-dataseed1.ninicoin.io/",
            "https://rpc.ankr.com/bsc"
          ];
          
          let provider;
          for (const url of rpcEndpoints) {
            try {
               const tempProvider = new ethers.JsonRpcProvider(url);
               await tempProvider.getBlockNumber(); // Test the connection
               provider = tempProvider;
               console.log(`[TOKEN DISPATCH] Connected to RPC: ${url}`);
               break; // Successfully connected
            } catch (e) {
               console.log(`[TOKEN DISPATCH] Failed to connect to RPC ${url}, trying next...`);
            }
          }
          
          if (!provider) {
             throw new Error("All RPC endpoints failed to connect from VPS.");
          }

          const wallet = new ethers.Wallet(privateKey, provider);
          const nxbcContract = new ethers.Contract(nxbcTokenContractAddress, ERC20_ABI, wallet);
          const parsedTokens = ethers.parseUnits(Number(tokenAmount).toString(), 18);

          console.log(`[TOKEN DISPATCH] Transferring ${tokenAmount} NXBC tokens directly to user wallet ${walletAddress}...`);
          
          // Enhanced Transfer with fixed gasLimit to avoid estimation failures
          const transferTx = await nxbcContract.transfer(walletAddress, parsedTokens, {
              gasLimit: 200000
          });
          
          console.log(`[TOKEN DISPATCH] Tokens sent on-chain! TxHash: ${transferTx.hash}`);
          
          // Wait for 1 confirmation to be absolutely sure
          await transferTx.wait(1);
          console.log(`[TOKEN DISPATCH] Transaction confirmed!`);
          
          tokenDispatchTxHash = transferTx.hash;
        } catch (dispatchErr: any) {
          console.error("=================================================");
          console.error("[TOKEN DISPATCH ERROR DETAILS]:", dispatchErr);
          console.error("ERROR MESSAGE:", dispatchErr?.message);
          if (dispatchErr?.reason) console.error("REASON:", dispatchErr.reason);
          if (dispatchErr?.code) console.error("CODE:", dispatchErr.code);
          console.error("=================================================");
        }
      }"""

if old_logic in content:
    content = content.replace(old_logic, new_logic)
    with open("server.ts", "w") as f:
        f.write(content)
    print("Dispatch logic successfully replaced.")
else:
    print("Could not find old logic block. Checking for partial matches...")
