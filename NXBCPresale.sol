// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title NXBC Presale Contract
 * @dev Handles instant distribution of NXBC tokens based on USDT payments.
 */

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function decimals() external view returns (uint8);
}

contract NXBCPresale {
    address public owner;
    IERC20 public nxbcToken;
    IERC20 public usdtToken;
    address public adminWallet;

    struct Phase {
        uint256 price; // Price per NXBC in USDT (with 18 decimals assumed for calculation)
        uint256 maxSupply; // Total tokens for sale in this phase (wei)
        uint256 tokensSold;
        bool isActive;
    }

    mapping(uint256 => Phase) public phases;
    uint256 public currentPhase;
    bool public presaleActive;

    event TokensPurchased(address indexed buyer, uint256 usdtAmount, uint256 nxbcAmount, uint256 phase);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _nxbcToken, address _usdtToken, address _adminWallet) {
        owner = msg.sender;
        nxbcToken = IERC20(_nxbcToken);
        usdtToken = IERC20(_usdtToken);
        adminWallet = _adminWallet;

        // Note: Assuming both NXBC and USDT use 18 decimals on BSC.
        // Phase 1: $0.01 | Supply for sale: 5 Lakh (500,000) (Admin keeps 500k separately)
        phases[1] = Phase(0.01 * 10**18, 500_000 * 10**18, 0, true);
        
        // Phase 2: $0.10 | Supply: 25 Lakh (2,500,000)
        phases[2] = Phase(0.10 * 10**18, 2_500_000 * 10**18, 0, true);
        
        // Phase 3: $1.00 | Supply: 70 Lakh (7,000,000)
        phases[3] = Phase(1.00 * 10**18, 7_000_000 * 10**18, 0, true);
        
        // Phase 4: $10.00 | Supply: 195 Lakh (19,500,000)
        phases[4] = Phase(10.00 * 10**18, 19_500_000 * 10**18, 0, true);
        
        // Phase 5: $100.00 | Supply: 400 Lakh (40,000,000)
        phases[5] = Phase(100.00 * 10**18, 40_000_000 * 10**18, 0, true);

        currentPhase = 1;
        presaleActive = true;
    }

    /**
     * @dev Buy NXBC tokens using USDT
     * @param usdtAmount Amount of USDT to spend (in wei)
     */
    function buyTokens(uint256 usdtAmount) external {
        require(presaleActive, "Presale is paused");
        require(currentPhase >= 1 && currentPhase <= 5, "Invalid phase");
        
        Phase storage phase = phases[currentPhase];
        require(phase.isActive, "Phase is not active");
        require(usdtAmount > 0, "Amount must be greater than 0");

        // Calculate NXBC amount: (usdtAmount * 1e18) / price
        // Example P1: (1 * 1e18 * 1e18) / 0.01 * 1e18 = 100 * 1e18 NXBC
        uint256 nxbcAmount = (usdtAmount * 10**18) / phase.price;

        require(nxbcAmount > 0, "Insufficient USDT for minimum NXBC");
        require(phase.tokensSold + nxbcAmount <= phase.maxSupply, "Not enough tokens left in current phase");

        // 1. Transfer USDT from Buyer to Admin Wallet
        require(usdtToken.transferFrom(msg.sender, adminWallet, usdtAmount), "USDT transfer failed. Check allowance.");

        // 2. Transfer NXBC from Presale Contract to Buyer
        require(nxbcToken.transfer(msg.sender, nxbcAmount), "NXBC transfer failed. Ensure contract has tokens.");

        // 3. Update stats
        phase.tokensSold += nxbcAmount;
        
        emit TokensPurchased(msg.sender, usdtAmount, nxbcAmount, currentPhase);
    }

    // Admin Functions
    
    function setPhase(uint256 _phase) external onlyOwner {
        require(_phase >= 1 && _phase <= 5, "Phase out of range");
        currentPhase = _phase;
    }

    function togglePresale(bool _status) external onlyOwner {
        presaleActive = _status;
    }

    function updateAdminWallet(address _newAdmin) external onlyOwner {
        adminWallet = _newAdmin;
    }

    // Recover unsold tokens or accidental deposits
    function recoverTokens(address _token, uint256 _amount) external onlyOwner {
        IERC20(_token).transfer(owner, _amount);
    }
}
