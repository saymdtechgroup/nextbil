const { ethers } = require("ethers");
require("dotenv").config();
async function main() {
  const privateKey = process.env.PAYOUT_HOT_WALLET_PRIVATE_KEY || process.env.SAFEPAL_PRIVATE_KEY;
  if(!privateKey) {
    console.log("No private key found.");
    return;
  }
  const provider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
  const wallet = new ethers.Wallet(privateKey, provider);
  console.log("Hot Wallet Address:", wallet.address);
  
  const balance = await provider.getBalance(wallet.address);
  console.log("BNB Balance:", ethers.formatEther(balance));
  
  const ERC20_ABI = ["function balanceOf(address owner) view returns (uint256)", "function transfer(address to, uint amount) returns (bool)"];
  const nxbcTokenContractAddress = "0xB44dC2107438D3f98e5A0784fBC6C6a2Ad843bd1"; 
  const contract = new ethers.Contract(nxbcTokenContractAddress, ERC20_ABI, wallet);
  const tokenBalance = await contract.balanceOf(wallet.address);
  console.log("NXBC Balance:", ethers.formatUnits(tokenBalance, 18));
}
main().catch(console.error);
