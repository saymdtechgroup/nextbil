const { ethers } = require("ethers");
require("dotenv").config();
async function main() {
  const privateKey = process.env.PAYOUT_HOT_WALLET_PRIVATE_KEY || process.env.SAFEPAL_PRIVATE_KEY;
  if(!privateKey) {
    console.log("No private key found.");
    return;
  }
  const wallet = new ethers.Wallet(privateKey);
  console.log("Hot Wallet Address:", wallet.address);
  
  const nxbcTokenContractAddress = "0xB44dC2107438D3f98e5A0784fBC6C6a2Ad843bd1"; 
  console.log("Will attempt to send from contract:", nxbcTokenContractAddress);
}
main();
