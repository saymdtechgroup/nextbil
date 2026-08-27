// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IERC20
 * @dev Interface of the ERC20 standard as defined in the EIP.
 */
interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title NXBCPresale
 * @dev Smart Contract to accept USDT for NXBC tokens.
 * The backend Node.js server listens to the events from this contract 
 * to allocate tokens in the PostgreSQL database and manage the 80/20 P2P Queue.
 */
contract NXBCPresale {
    address public owner;
    address public adminTreasury; // SafePal wallet for 80% platform reserve
    address public payoutWallet;  // Hot wallet for 20% P2P FIFO user payouts
    IERC20 public usdtToken;      // USDT Token address on Binance Smart Chain

    bool public isSaleActive = true;

    // Events that our Node.js backend will listen to
    event TokensPurchased(
        address indexed buyer, 
        uint256 usdtAmount, 
        uint256 expectedNxbc, 
        string referralCode
    );

    // Modifier to restrict admin access
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    /**
     * @param _usdtAddress The smart contract address of USDT on BSC
     * @param _adminTreasury The wallet where 80% funds will be stored safely
     * @param _payoutWallet The wallet where 20% funds go for instant P2P payouts
     */
    constructor(address _usdtAddress, address _adminTreasury, address _payoutWallet) {
        owner = msg.sender;
        usdtToken = IERC20(_usdtAddress);
        adminTreasury = _adminTreasury;
        payoutWallet = _payoutWallet;
    }

    /**
     * @dev Main function called by users when they click "Buy Now" on the website.
     * User must first approve this contract to spend their USDT.
     */
    function buyTokens(uint256 usdtAmount, uint256 expectedNxbc, string memory referralCode) external {
        require(isSaleActive, "Presale is currently paused");
        require(usdtAmount > 0, "Amount must be greater than zero");

        // Calculate the 80/20 split directly on the blockchain
        uint256 p2pShare = (usdtAmount * 20) / 100; // 20%
        uint256 adminShare = usdtAmount - p2pShare; // 80%

        // Transfer 80% directly to the Admin Treasury Wallet
        require(
            usdtToken.transferFrom(msg.sender, adminTreasury, adminShare),
            "USDT transfer to treasury failed. Check allowance."
        );

        // Transfer 20% directly to the Payout Hot Wallet (used by backend for FIFO queue)
        require(
            usdtToken.transferFrom(msg.sender, payoutWallet, p2pShare),
            "USDT transfer to payout wallet failed. Check allowance."
        );

        // Emit event for our Node.js Backend to catch and update the PostgreSQL database
        emit TokensPurchased(msg.sender, usdtAmount, expectedNxbc, referralCode);
    }

    // --- Admin Functions ---

    function setSaleStatus(bool _status) external onlyOwner {
        isSaleActive = _status;
    }

    function updateWallets(address _adminTreasury, address _payoutWallet) external onlyOwner {
        adminTreasury = _adminTreasury;
        payoutWallet = _payoutWallet;
    }

    // Emergency function to recover accidentally sent tokens
    function recoverTokens(address tokenAddress, uint256 amount) external onlyOwner {
        IERC20(tokenAddress).transfer(owner, amount);
    }
}
