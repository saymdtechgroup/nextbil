const { ethers } = require("ethers");
const provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.binance.org/");

const usdtAddress = "0x55d398326f99059fF775485246999027B3197955";
const userWallet = "0x8d1abCa8Cf0f42799b9a76254710e979bd59c261";

const erc20Abi = [
  "function balanceOf(address) external view returns (uint256)",
  "function decimals() external view returns (uint8)"
];

async function main() {
  const token = new ethers.Contract(usdtAddress, erc20Abi, provider);
  const balance = await token.balanceOf(userWallet);
  console.log(`USDT Balance of ${userWallet}:`, ethers.formatUnits(balance, 18));
}
main().catch(console.error);
