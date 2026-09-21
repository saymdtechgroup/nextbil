# NXBC Contract Address Map

These are the addresses for the current live setup.

- **NXBC token contract:** `0x94D064AFDB04E3489C313054260929588b38dF85`
- **Current live presale contract:** `0x0C4a86691B3937549BFa688211EbF56520B64981`
- **Admin / NXBC return wallet:** `0x8d1abCa8Cf0f42799b9a76254710e979bd59c261`
- **BSC USDT:** `0x55d398326f99059fF775485246999027B3197955`

## Withdrawal security

For Token Sell withdrawals, the server must verify an actual BSC ERC-20 `Transfer` event for the **NXBC token contract**, with:

- `from` = the withdrawing user's wallet
- `to` = the admin / NXBC return wallet
- amount = the exact server-calculated NXBC amount
- successful BSC receipt

Only after that verification succeeds may the real USDT payout be sent. The live presale contract address is **not** used as the NXBC token address and is **not** the return destination.

The `contracts/NXBCPresale.sol` file in this repository is a **legacy/reference contract**, not the current live presale deployment.
