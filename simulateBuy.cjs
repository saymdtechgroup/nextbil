const { ethers } = require("ethers");
const provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.binance.org/");

const presaleAddress = "0x85363386808d1f26BF3805Bb44a093a2Af9E8783";
const userWallet = "0x8d1abCa8Cf0f42799b9a76254710e979bd59c261";

const abi = [
  "function buyTokens(uint256 usdtAmount) external"
];

async function main() {
  const contract = new ethers.Contract(presaleAddress, abi, provider);
  const amountWei = ethers.parseUnits("1", 18);
  
  try {
    const gasEstimate = await contract.buyTokens.estimateGas(amountWei, { from: userWallet });
    console.log("Gas Estimate:", gasEstimate.toString());
  } catch (e) {
    console.error("Simulation Reverted:", e);
  }
}
main().catch(console.error);
