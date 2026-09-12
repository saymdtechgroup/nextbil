const { ethers } = require("ethers");
require("dotenv").config();
const privKey = process.env.PAYOUT_HOT_WALLET_PRIVATE_KEY || process.env.SAFEPAL_PRIVATE_KEY;
if (privKey) {
  try {
     const wallet = new ethers.Wallet(privKey);
     console.log("-----------------------------------------");
     console.log("Aapke server me is wallet ki Private Key load hai:");
     console.log(wallet.address);
     console.log("-----------------------------------------");
  } catch(e) {
     console.log("Private key galat format me hai.");
  }
} else {
  console.log("Server me koi Private Key nahi mili.");
}
