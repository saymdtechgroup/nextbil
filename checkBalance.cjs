const { ethers } = require("ethers");

const rpc = "https://bsc-dataseed1.binance.org/";
const provider = new ethers.JsonRpcProvider(rpc);

const nxbcAddress = "0x3F9d8f0b233A7764b567342Bc90c2a1Ac0961ff7";
const contractAddress = "0x85363386808d1f26BF3805Bb44a093a2Af9E8783";

const erc20Abi = [
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function symbol() external view returns (string)"
];

async function main() {
  const token = new ethers.Contract(nxbcAddress, erc20Abi, provider);
  const balance = await token.balanceOf(contractAddress);
  const decimals = await token.decimals();
  const symbol = await token.symbol();
  
  console.log(`Balance of ${contractAddress}:`);
  console.log(`${ethers.formatUnits(balance, decimals)} ${symbol}`);
}

main().catch(console.error);
