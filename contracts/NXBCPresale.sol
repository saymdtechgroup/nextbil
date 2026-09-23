// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/**
 * NXBC Presale - deployed BSC Mainnet instance is the source of truth.
 * NXBC:   0xB44dC2107438D3f98e5A0784fBC6C6a2Ad843bd1
 * USDT:   0x55d398326f99059fF775485246999027B3197955
 * Admin:  0x8d1abCa8Cf0f42799b9a76254710e979bd59c261
 * Presale:0x0C4a86691B3937549BFa688211EbF56520B64981
 */
contract NXBCPresale {
    uint256 public constant DECIMALS = 1e18;
    uint256 public constant TOTAL_PRESALE_SUPPLY = 70_000_000 * DECIMALS;
    uint256 public constant TOTAL_PHASES = 5;

    IERC20 public immutable nxbcToken;
    IERC20 public immutable usdtToken;
    address public owner;
    address public adminWallet;
    bool public presaleActive = true;
    uint256 private unlocked = 1;

    struct Phase {
        uint256 price;
        uint256 allocation;
        uint256 sold;
    }

    Phase[5] public phases;
    uint256 public currentPhase = 1;

    event TokensPurchased(address indexed buyer, uint256 indexed phase, uint256 usdtAmount, uint256 nxbcAmount);
    event PhaseCompleted(uint256 indexed phase);
    event PresaleStatusChanged(bool active);
    event AdminWalletUpdated(address indexed oldWallet, address indexed newWallet);
    event TokensRecovered(address indexed token, address indexed recipient, uint256 amount);
    event OwnershipTransferred(address indexed oldOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier nonReentrant() {
        require(unlocked == 1, "ReentrancyGuard");
        unlocked = 2;
        _;
        unlocked = 1;
    }

    constructor(address _nxbcToken, address _usdtToken, address _adminWallet) {
        require(_nxbcToken != address(0), "Invalid NXBC address");
        require(_usdtToken != address(0), "Invalid USDT address");
        require(_adminWallet != address(0), "Invalid admin wallet");

        owner = msg.sender;
        nxbcToken = IERC20(_nxbcToken);
        usdtToken = IERC20(_usdtToken);
        adminWallet = _adminWallet;

        phases[0] = Phase({price: 1e16, allocation: 1_000_000 * DECIMALS, sold: 0});
        phases[1] = Phase({price: 1e17, allocation: 2_500_000 * DECIMALS, sold: 0});
        phases[2] = Phase({price: 1e18, allocation: 7_000_000 * DECIMALS, sold: 0});
        phases[3] = Phase({price: 10e18, allocation: 19_500_000 * DECIMALS, sold: 0});
        phases[4] = Phase({price: 100e18, allocation: 40_000_000 * DECIMALS, sold: 0});
    }

    function buyTokens(uint256 usdtAmount) external nonReentrant {
        require(presaleActive, "Presale is not active");
        require(usdtAmount > 0, "Amount must be greater than zero");

        uint256 phaseIndex = currentPhase - 1;
        Phase storage phase = phases[phaseIndex];
        uint256 nxbcAmount = (usdtAmount * DECIMALS) / phase.price;

        require(nxbcAmount > 0, "Amount too small");
        uint256 remaining = phase.allocation - phase.sold;
        require(nxbcAmount <= remaining, "Amount exceeds current phase");
        require(nxbcToken.balanceOf(address(this)) >= nxbcAmount, "Presale NXBC balance insufficient");

        require(usdtToken.transferFrom(msg.sender, adminWallet, usdtAmount), "USDT transfer failed");
        phase.sold += nxbcAmount;
        require(nxbcToken.transfer(msg.sender, nxbcAmount), "NXBC transfer failed");

        emit TokensPurchased(msg.sender, currentPhase, usdtAmount, nxbcAmount);

        if (phase.sold == phase.allocation) {
            emit PhaseCompleted(currentPhase);
            if (currentPhase < TOTAL_PHASES) {
                currentPhase += 1;
            } else {
                presaleActive = false;
                emit PresaleStatusChanged(false);
            }
        }
    }

    function togglePresale() external onlyOwner {
        presaleActive = !presaleActive;
        emit PresaleStatusChanged(presaleActive);
    }

    function updateAdminWallet(address newWallet) external onlyOwner {
        require(newWallet != address(0), "Invalid wallet");
        address oldWallet = adminWallet;
        adminWallet = newWallet;
        emit AdminWalletUpdated(oldWallet, newWallet);
    }

    function currentPhasePrice() external view returns (uint256) {
        return phases[currentPhase - 1].price;
    }

    function currentPhaseAllocation() external view returns (uint256) {
        return phases[currentPhase - 1].allocation;
    }

    function currentPhaseSold() external view returns (uint256) {
        return phases[currentPhase - 1].sold;
    }

    function currentPhaseRemaining() external view returns (uint256) {
        Phase memory phase = phases[currentPhase - 1];
        return phase.allocation - phase.sold;
    }

    function remainingPresaleSupply() public view returns (uint256) {
        uint256 remaining = 0;
        for (uint256 i = currentPhase - 1; i < TOTAL_PHASES; i++) {
            remaining += phases[i].allocation - phases[i].sold;
        }
        return remaining;
    }

    function presaleNXBCBalance() external view returns (uint256) {
        return nxbcToken.balanceOf(address(this));
    }

    function totalSold() external view returns (uint256) {
        uint256 sold = 0;
        for (uint256 i = 0; i < TOTAL_PHASES; i++) {
            sold += phases[i].sold;
        }
        return sold;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid owner");
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }

    function recoverToken(address token, address recipient, uint256 amount) external onlyOwner {
        require(token != address(0), "Invalid token");
        require(recipient != address(0), "Invalid recipient");
        IERC20 tokenContract = IERC20(token);
        uint256 balance = tokenContract.balanceOf(address(this));
        require(amount <= balance, "Insufficient balance");

        if (token == address(nxbcToken)) {
            uint256 requiredNXBC = remainingPresaleSupply();
            require(balance - amount >= requiredNXBC, "Cannot withdraw required NXBC");
        }

        require(tokenContract.transfer(recipient, amount), "Token recovery failed");
        emit TokensRecovered(token, recipient, amount);
    }

    function getOwner() external view returns (address) { return owner; }
    function getAdminWallet() external view returns (address) { return adminWallet; }
    function isPresaleActive() external view returns (bool) { return presaleActive; }
}
