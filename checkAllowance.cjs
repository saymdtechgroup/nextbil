const { ethers } = require("ethers");
const provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.binance.org/");

const usdtAddress = "0x55d398326f99059fF775485246999027B3197955";
const userWallet = "0x8d1abCa8Cf0f42799b9a76254710e979bd59c261";
const presaleAddress = "0x85363386808d1f26BF3805Bb44a093a2Af9E8783";

const erc20Abi = [
  "function allowance(address owner, address spender) external view returns (uint256)"
];

async function main() {
  const token = new ethers.Contract(usdtAddress, erc20Abi, provider);
  const allowance = await token.allowance(userWallet, presaleAddress);
  console.log(`Allowance:`, ethers.formatUnits(allowance, 18));
}
main().catch(console.error);
