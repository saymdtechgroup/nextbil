const { ethers } = require("ethers");
async function main() {
  const provider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
  const ERC20_ABI = ["function transfer(address to, uint256 value) public returns (bool)"];
  const contractAddress = "0xB44dC2107438D3f98e5A0784fBC6C6a2Ad843bd1";
  const wallet = new ethers.Wallet(process.env.PAYOUT_HOT_WALLET_PRIVATE_KEY || process.env.SAFEPAL_PRIVATE_KEY, provider);
  const contract = new ethers.Contract(contractAddress, ERC20_ABI, wallet);
  
  try {
     const toAddress = "0x000000000000000000000000000000000000dead";
     const amount = ethers.parseUnits("1", 18);
     
     // Estimate Gas
     const estGas = await contract.transfer.estimateGas(toAddress, amount);
     console.log("Estimated Gas:", estGas.toString());
     
  } catch (e) {
     console.log("Simulation Failed:", e.reason || e.message);
  }
}
main();
