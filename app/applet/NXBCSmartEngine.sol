// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title NXBC Smart Contract Engine
 * @dev Handles buying (full mint to user), virtual FIFO queueing, 80/20 execution, and Atomic Withdrawals.
 */
contract NXBCSmartEngine is Ownable, ReentrancyGuard {
    IERC20 public nxbcToken;
    IERC20 public usdtToken;
    address public adminWallet;

    struct Phase {
        uint256 price; // Price per NXBC in USDT (using 18 decimals)
        uint256 totalSupply;
        uint256 tokensSold;
        bool isActive;
    }

    mapping(uint256 => Phase) public phases;
    uint256 public currentPhase;
    bool public presaleActive;

    // ----- The 80/20 & Virtual Queue Storage -----
    
    // Total USDT earned by users waiting to be withdrawn (Special Withdrawal Wallet)
    mapping(address => uint256) public claimableUsdt;

    // Since mapping iteration is not possible on-chain, in a production environment,
    // the heavy lifting of the FIFO 80/20 matching is done off-chain (by the backend),
    // and the result is fed to the contract via `executeVirtualSales`.
    // We store user's virtually allocated tokens to ensure they cannot exceed their balance.
    mapping(address => mapping(uint256 => uint256)) public virtualAllocations; // user => phase => tokenAmount

    event TokensPurchased(address indexed buyer, uint256 usdtAmount, uint256 nxbcAmount, uint256 phase);
    event VirtualAllocationSet(address indexed user, uint256 phase, uint256 nxbcAmount);
    event SaleExecuted(address indexed seller, uint256 nxbcSold, uint256 usdtEarned, uint256 phase);
    event AtomicWithdrawal(address indexed user, uint256 usdtClaimed, uint256 nxbcSwapped);

    constructor(address _nxbcToken, address _usdtToken, address _adminWallet) Ownable(msg.sender) {
        nxbcToken = IERC20(_nxbcToken);
        usdtToken = IERC20(_usdtToken);
        adminWallet = _adminWallet;

        // Phase 1: $0.01 | Supply for sale: 5 Lakh
        phases[1] = Phase(0.01 * 10**18, 500_000 * 10**18, 0, true);
        // Phase 2: $0.10 | Supply: 25 Lakh
        phases[2] = Phase(0.10 * 10**18, 2_500_000 * 10**18, 0, false);
        // Phase 3: $1.00 | Supply: 70 Lakh
        phases[3] = Phase(1.00 * 10**18, 7_000_000 * 10**18, 0, false);
        // Phase 4: $10.00 | Supply: 195 Lakh
        phases[4] = Phase(10.00 * 10**18, 19_500_000 * 10**18, 0, false);
        // Phase 5: $100.00 | Supply: 400 Lakh
        phases[5] = Phase(100.00 * 10**18, 40_000_000 * 10**18, 0, false);

        currentPhase = 1;
        presaleActive = true;
    }

    // ==========================================
    // STEP 1: BUYING (FULL MINT TO USER)
    // ==========================================
    
    /**
     * @dev Buy NXBC tokens using USDT. 100% tokens are sent directly to the user's wallet.
     * @param usdtAmount Amount of USDT to spend (in wei)
     */
    function buyTokens(uint256 usdtAmount) external nonReentrant {
        require(presaleActive, "Presale is paused");
        Phase storage phase = phases[currentPhase];
        require(phase.isActive, "Current phase is not active");
        require(usdtAmount > 0, "Amount must be greater than 0");

        // Calculate NXBC amount based on current phase price
        uint256 nxbcAmount = (usdtAmount * 10**18) / phase.price;
        require(nxbcAmount > 0, "Insufficient USDT");
        require(phase.tokensSold + nxbcAmount <= phase.totalSupply, "Not enough tokens left in phase");

        // Transfer USDT from Buyer to Admin Wallet
        require(usdtToken.transferFrom(msg.sender, adminWallet, usdtAmount), "USDT transfer failed");

        // Transfer NXBC from Contract (or Mint if contract has rights) to Buyer's Trust Wallet
        require(nxbcToken.transfer(msg.sender, nxbcAmount), "NXBC transfer failed");

        phase.tokensSold += nxbcAmount;
        emit TokensPurchased(msg.sender, usdtAmount, nxbcAmount, currentPhase);
    }

    // ==========================================
    // STEP 2: VIRTUAL LOCKING (RECORDING)
    // ==========================================
    
    /**
     * @dev User registers their intent to sell X tokens in a future phase.
     * Tokens REMAIN in the user's wallet. We only record the intent.
     */
    function setVirtualAllocation(uint256 targetPhase, uint256 nxbcAmount) external {
        require(targetPhase > currentPhase && targetPhase <= 5, "Can only allocate for future phases");
        
        // Ensure user actually has enough tokens in their wallet to make this promise
        require(nxbcToken.balanceOf(msg.sender) >= nxbcAmount, "Insufficient NXBC in wallet");
        
        virtualAllocations[msg.sender][targetPhase] = nxbcAmount;
        emit VirtualAllocationSet(msg.sender, targetPhase, nxbcAmount);
    }

    // ==========================================
    // STEP 3: THE 80/20 EXECUTION (BY ADMIN/BACKEND)
    // ==========================================
    
    /**
     * @dev When new buys happen, the backend calculates the 80/20 FIFO matching.
     * It calls this function to officially credit USDT to the sellers' Claimable balances.
     * @param sellers Array of user addresses who were next in the FIFO queue.
     * @param nxbcAmounts Array of NXBC amounts sold for each user.
     * @param phase The phase at which they were sold.
     */
    function executeVirtualSales(
        address[] calldata sellers, 
        uint256[] calldata nxbcAmounts, 
        uint256 phase
    ) external onlyOwner {
        require(sellers.length == nxbcAmounts.length, "Array length mismatch");
        require(phases[phase].isActive, "Phase not active");

        uint256 price = phases[phase].price;

        for(uint256 i = 0; i < sellers.length; i++) {
            address seller = sellers[i];
            uint256 soldTokens = nxbcAmounts[i];
            
            // Ensure they had this much virtually allocated
            require(virtualAllocations[seller][phase] >= soldTokens, "Amount exceeds virtual allocation");
            
            // Reduce their virtual allocation
            virtualAllocations[seller][phase] -= soldTokens;
            
            // Calculate USDT earned: (soldTokens * price) / 1e18
            uint256 usdtEarned = (soldTokens * price) / 10**18;
            
            // Credit USDT to their special withdrawal wallet
            claimableUsdt[seller] += usdtEarned;
            
            emit SaleExecuted(seller, soldTokens, usdtEarned, phase);
        }
    }

    // ==========================================
    // STEP 4: ATOMIC WITHDRAWAL & SWAP
    // ==========================================
    
    /**
     * @dev User withdraws their earned USDT.
     * The contract atomically deducts the exact equivalent of NXBC from their wallet
     * and sends the USDT. If they don't have the NXBC anymore, it fails.
     */
    function atomicWithdraw() external nonReentrant {
        uint256 usdtAmount = claimableUsdt[msg.sender];
        require(usdtAmount > 0, "No claimable USDT");

        // We need to calculate how many NXBC tokens this USDT represents.
        // Since different phases have different prices, we could track the exact NXBC owed per user.
        // For this atomic swap, we define the "Swap Rate" based on the phase they sold in.
        // To simplify on-chain math for multiple phases, we require the backend to have fed the exact 
        // total NXBC owed into a mapping during execution, OR we calculate it dynamically.
        
        // *Simplified logic for the prototype:* 
        // We assume the withdrawal is based on the current active phase price.
        uint256 nxbcRequired = (usdtAmount * 10**18) / phases[currentPhase].price;

        // Check if user still holds the required NXBC in their Trust Wallet
        require(nxbcToken.balanceOf(msg.sender) >= nxbcRequired, "Insufficient NXBC for atomic swap");
        
        // 1. DEDUCT NXBC from User -> Admin
        // This requires the user to have approved this contract on the NXBC token contract.
        require(nxbcToken.transferFrom(msg.sender, adminWallet, nxbcRequired), "NXBC deduction failed. Check allowance.");

        // 2. Reset claimable balance
        claimableUsdt[msg.sender] = 0;
        
        // 3. CREDIT USDT to User
        // Note: The Admin/Contract must have funded this contract with enough USDT to pay out.
        // Or we transfer directly from Admin wallet if the contract has allowance.
        require(usdtToken.transferFrom(adminWallet, msg.sender, usdtAmount), "USDT payout failed. Admin must approve USDT.");

        emit AtomicWithdrawal(msg.sender, usdtAmount, nxbcRequired);
    }

    // ==========================================
    // ADMIN FUNCTIONS
    // ==========================================
    
    function setPhaseStatus(uint256 _phase, bool _status) external onlyOwner {
        require(_phase >= 1 && _phase <= 5, "Phase out of range");
        phases[_phase].isActive = _status;
        if (_status) {
            currentPhase = _phase;
        }
    }

    function togglePresale(bool _status) external onlyOwner {
        presaleActive = _status;
    }

    function fundContractWithUSDT(uint256 amount) external onlyOwner {
        require(usdtToken.transferFrom(msg.sender, address(this), amount), "Funding failed");
    }
}
