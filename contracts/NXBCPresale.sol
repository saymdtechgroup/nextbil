// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @dev Standard BEP-20 / ERC-20 Interface
 */
interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 value) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

/**
 * @dev ReentrancyGuard for Hacker Protection
 */
abstract contract ReentrancyGuard {
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status;

    constructor() {
        _status = _NOT_ENTERED;
    }

    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }
}

/**
 * @dev Ownable Access Control
 */
abstract contract Ownable {
    address private _owner;
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor(address initialOwner) {
        require(initialOwner != address(0), "Ownable: zero address");
        _owner = initialOwner;
        emit OwnershipTransferred(address(0), initialOwner);
    }

    function owner() public view virtual returns (address) {
        return _owner;
    }

    modifier onlyOwner() {
        require(owner() == msg.sender, "Ownable: caller is not the owner");
        _;
    }

    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is zero address");
        emit OwnershipTransferred(_owner, newOwner);
        _owner = newOwner;
    }
}

/**
 * @title NXBCPresale
 * @notice Complete Decentralized Presale, In-Contract USDT<->NXBUSD 1:1 Swap, 10-Tier Unilevel, 2x2 Matrix & Pure Cash Leadership Funds
 * 
 * --- CONFIGURATION (HARDCODED ADDRESSES): ---
 * 1. NXBC Token:      0x3F9d8f0b233A7764b567342Bc90c2a1Ac0961ff7
 * 2. NXBUSD Token:    0xbEFB5857cd4309a4a64f92Dd67507c34fCbca78b
 * 3. USDT Token:      0x55d398326f99059fF775485246999027B3197955 (BSC-USD Mainnet)
 * 4. Treasury Vault:  0x8d1abCa8Cf0f42799b9a76254710e979bd59c261
 */
contract NXBCPresale is Ownable, ReentrancyGuard {

    // --- HARDCODED CONTRACT ADDRESSES ---
    IERC20 public constant nxbcToken = IERC20(0x3F9d8f0b233A7764b567342Bc90c2a1Ac0961ff7);
    IERC20 public constant nxbusdToken = IERC20(0xbEFB5857cd4309a4a64f92Dd67507c34fCbca78b);
    IERC20 public constant usdtToken = IERC20(0x55d398326f99059fF775485246999027B3197955);
    address public treasuryWallet = 0x8d1abCa8Cf0f42799b9a76254710e979bd59c261;

    // --- PLATFORM WITHDRAWAL DEDUCTION ---
    uint256 public constant WITHDRAWAL_DEDUCTION_PERCENT = 10; // 10% Flat Fee to Treasury

    // --- PRESALE PHASE CONFIGURATION ---
    struct Phase {
        uint256 rateNumerator;   // e.g. 1
        uint256 rateDenominator; // e.g. 100 ($0.01 per token)
        uint256 totalSupply;     // Tokens allocated for phase
        uint256 tokensSold;      // Sold count
        bool isActive;
    }

    uint8 public currentPhase = 1;
    mapping(uint8 => Phase) public phases;
    bool public presalePaused = false;

    // --- MLM COMMISSIONS CONFIGURATION ---
    uint256 public constant DIRECT_SPONSOR_PERCENT = 10; // 10% Direct Referral
    uint256[10] public levelBasisPoints = [300, 200, 100, 100, 50, 50, 50, 50, 50, 50]; // L1: 3%, L2: 2%, L3: 1%, L4: 1%, L5-10: 0.5%
    uint256 public constant MLM_QUALIFY_THRESHOLD_USD = 100 * 1e18; // $100 Cumulative Buy to qualify for bonuses
    uint256 public constant MINIMUM_PURCHASE_USD = 1 * 1e18; // Minimum $1.00 USD purchase

    // --- 2x2 AUTO-SPILLOVER MATRIX CONFIGURATION ---
    uint256 public constant MATRIX_PLACEMENT_INCOME = 1 * 1e18; // $1.00 USD
    uint256 public constant MATRIX_UPLINE_SHARE_PERCENT = 10;   // 10% ($0.10 each to 10 uplines)

    struct MatrixNode {
        address userAddress;
        address parent;
        address leftChild;
        address rightChild;
        uint256 matrixEarningsUsd;
        bool exists;
    }

    mapping(address => MatrixNode) public matrixNodes;
    address[] public matrixQueue;
    uint256 public matrixHead = 0;

    // --- DUAL-LEDGER USER STRUCTURE ---
    struct UserFinancials {
        uint256 totalInvestedUsd;
        uint256 mlmEarnedUsd;
        uint256 mlmAvailableUsd;
        uint256 tokenSellEarnedUsd;
        uint256 tokenSellAvailableUsd;
        uint256 pendingNxbcToDeduct;
        uint256 totalWithdrawnUsd;
    }

    struct UserStats {
        address sponsor;
        uint256 directReferralCount;
        uint256 directVolumeUsd;
        uint256 teamVolumeUsd;
        uint8 rank;
        bool isQualified;
        bool inMatrix;
    }

    mapping(address => UserFinancials) public userFin;
    mapping(address => UserStats) public userStat;
    mapping(address => address[]) public directReferrals;

    // --- VIRTUAL QUEUE RECORD ---
    struct VirtualSellAllocation {
        uint256 p2Tokens;
        uint256 p3Tokens;
        uint256 p4Tokens;
        uint256 p5Tokens;
        uint256 dexTokens;
        uint256 p2SoldTokens;
        uint256 p3SoldTokens;
        uint256 p4SoldTokens;
        uint256 p5SoldTokens;
        uint256 timestamp;
    }

    mapping(address => VirtualSellAllocation) public virtualAllocations;

    // --- EVENTS ---
    event UsdtSwappedToNxbUsd(address indexed user, uint256 amount);
    event NxbUsdSwappedToUsdt(address indexed user, uint256 amount);
    event TokensPurchased(address indexed buyer, address indexed sponsor, uint256 nxbusdAmount, uint256 tokenAmount, uint8 phase);
    event DirectBonusPaid(address indexed sponsor, address indexed buyer, uint256 bonusAmount);
    event LevelCommissionPaid(address indexed upline, address indexed buyer, uint8 level, uint256 amount);
    event MatrixNodePlaced(address indexed user, address indexed parent, string position);
    event MatrixBonusPaid(address indexed recipient, address indexed fromUser, uint256 amount, string bonusType);
    event PhaseSellExecuted(address indexed user, uint8 phase, uint256 tokensSold, uint256 usdtEarned);
    event MlmWithdrawal(address indexed user, uint256 grossAmount, uint256 netPayout, uint256 feeDeducted);
    event TokenSellWithdrawal(address indexed user, uint256 grossAmount, uint256 netPayout, uint256 feeDeducted, uint256 exactNxbcDeducted);
    event RankUpgraded(address indexed user, uint8 indexed newRank);
    event RankRewardPaid(address indexed user, uint8 indexed rank, uint256 rewardUsd, string fundName);

    constructor() Ownable(msg.sender) {
        matrixNodes[msg.sender] = MatrixNode({
            userAddress: msg.sender,
            parent: address(0),
            leftChild: address(0),
            rightChild: address(0),
            matrixEarningsUsd: 0,
            exists: true
        });
        matrixQueue.push(msg.sender);
        userStat[msg.sender].inMatrix = true;
        userStat[msg.sender].isQualified = true;

        phases[1] = Phase(1, 100, 10_000_000 * 1e18, 0, true);
        phases[2] = Phase(10, 100, 8_000_000 * 1e18, 0, false);
        phases[3] = Phase(20, 100, 6_000_000 * 1e18, 0, false);
        phases[4] = Phase(30, 100, 4_000_000 * 1e18, 0, false);
        phases[5] = Phase(40, 100, 2_000_000 * 1e18, 0, false);
    }

    // =========================================================================
    // 💱 1. 1:1 PEGGED SWAP ENGINE (USDT <--> NXBUSD)
    // =========================================================================

    function swapUsdtToNxbUsd(uint256 usdtAmount) external nonReentrant {
        require(usdtAmount > 0, "Amount must be > 0");

        require(
            usdtToken.transferFrom(msg.sender, treasuryWallet, usdtAmount),
            "USDT transfer to treasury failed"
        );

        require(
            nxbusdToken.transfer(msg.sender, usdtAmount),
            "NXBUSD transfer failed"
        );

        emit UsdtSwappedToNxbUsd(msg.sender, usdtAmount);
    }

    function swapNxbUsdToUsdt(uint256 nxbusdAmount) external nonReentrant {
        require(nxbusdAmount > 0, "Amount must be > 0");

        require(
            nxbusdToken.transferFrom(msg.sender, address(this), nxbusdAmount),
            "NXBUSD transfer failed"
        );

        require(
            usdtToken.transfer(msg.sender, nxbusdAmount),
            "USDT transfer failed"
        );

        emit NxbUsdSwappedToUsdt(msg.sender, nxbusdAmount);
    }

    // =========================================================================
    // 🪙 2. BUY NXBC TOKENS (MINIMUM $1.00 USD)
    // =========================================================================

    function buyTokens(
        uint256 nxbusdAmount,
        address sponsor
    ) external nonReentrant {
        require(!presalePaused, "Presale paused");
        require(nxbusdAmount >= MINIMUM_PURCHASE_USD, "Min $1.00 NXBUSD purchase");

        Phase storage phase = phases[currentPhase];
        require(phase.isActive, "Phase inactive");

        uint256 tokenAmount = (nxbusdAmount * phase.rateDenominator) / phase.rateNumerator;
        require(phase.tokensSold + tokenAmount <= phase.totalSupply, "Sold out");

        // 1. Transfer NXBUSD to Treasury
        require(
            nxbusdToken.transferFrom(msg.sender, treasuryWallet, nxbusdAmount),
            "NXBUSD transfer failed"
        );

        // 2. Transfer NXBC to Buyer
        phase.tokensSold += tokenAmount;
        require(
            nxbcToken.transfer(msg.sender, tokenAmount),
            "NXBC delivery failed"
        );

        // 3. Update Hierarchy & Qualify
        _processUserPurchase(msg.sender, sponsor, nxbusdAmount);

        // 4. Matrix Placement
        if (!userStat[msg.sender].inMatrix) {
            _autoPlaceInMatrix(msg.sender);
        }

        emit TokensPurchased(msg.sender, userStat[msg.sender].sponsor, nxbusdAmount, tokenAmount, currentPhase);
    }

    function _processUserPurchase(address buyer, address sponsor, uint256 nxbusdAmount) internal {
        UserStats storage stat = userStat[buyer];
        if (stat.sponsor == address(0) && sponsor != address(0) && sponsor != buyer) {
            stat.sponsor = sponsor;
            userStat[sponsor].directReferralCount += 1;
            directReferrals[sponsor].push(buyer);
        }

        UserFinancials storage fin = userFin[buyer];
        fin.totalInvestedUsd += nxbusdAmount;
        if (fin.totalInvestedUsd >= MLM_QUALIFY_THRESHOLD_USD) {
            stat.isQualified = true;
        }

        if (stat.sponsor != address(0)) {
            userStat[stat.sponsor].directVolumeUsd += nxbusdAmount;
            _updateUplineVolumeAndRank(stat.sponsor, nxbusdAmount);
        }

        _distributeCommissions(buyer, nxbusdAmount);
    }

    // =========================================================================
    // 🪜 3. MLM COMMISSIONS & LEADERSHIP FUND ENGINE
    // =========================================================================

    function _distributeCommissions(address buyer, uint256 amountUsd) internal {
        address directSponsor = userStat[buyer].sponsor;

        // 1. Direct Sponsor Bonus (10%)
        if (directSponsor != address(0) && userStat[directSponsor].isQualified) {
            uint256 directBonus = (amountUsd * DIRECT_SPONSOR_PERCENT) / 100;
            userFin[directSponsor].mlmEarnedUsd += directBonus;
            userFin[directSponsor].mlmAvailableUsd += directBonus;
            emit DirectBonusPaid(directSponsor, buyer, directBonus);
        }

        // 2. 10-Tier Level Commissions
        address currentUpline = directSponsor;
        for (uint8 i = 0; i < 10 && currentUpline != address(0); i++) {
            if (userStat[currentUpline].isQualified) {
                uint256 levelBonus = (amountUsd * levelBasisPoints[i]) / 10000;
                userFin[currentUpline].mlmEarnedUsd += levelBonus;
                userFin[currentUpline].mlmAvailableUsd += levelBonus;
                emit LevelCommissionPaid(currentUpline, buyer, i + 1, levelBonus);
            }
            currentUpline = userStat[currentUpline].sponsor;
        }
    }

    function _updateUplineVolumeAndRank(address startUpline, uint256 amountUsd) internal {
        address current = startUpline;
        for (uint8 i = 0; i < 15 && current != address(0); i++) {
            userStat[current].teamVolumeUsd += amountUsd;
            _checkAndUpgradeRank(current);
            current = userStat[current].sponsor;
        }
    }

    function _checkAndUpgradeRank(address userAddr) internal {
        UserStats storage u = userStat[userAddr];
        uint256 directVol = u.directVolumeUsd;
        uint256 teamVol = u.teamVolumeUsd;

        // 1. Team Dev Fund ($100 Cash): Direct $50,000 USD
        if (u.rank < 1 && directVol >= 50_000 * 1e18) {
            u.rank = 1;
            uint256 reward = 100 * 1e18;
            userFin[userAddr].mlmEarnedUsd += reward;
            userFin[userAddr].mlmAvailableUsd += reward;
            emit RankUpgraded(userAddr, 1);
            emit RankRewardPaid(userAddr, 1, reward, "TEAM_DEVELOPMENT_FUND");
        }

        // 2. Salary ($100 / Month): Direct $100,000 USD
        if (u.rank < 2 && directVol >= 100_000 * 1e18) {
            u.rank = 2;
            uint256 initialSalary = 100 * 1e18;
            userFin[userAddr].mlmEarnedUsd += initialSalary;
            userFin[userAddr].mlmAvailableUsd += initialSalary;
            emit RankUpgraded(userAddr, 2);
            emit RankRewardPaid(userAddr, 2, initialSalary, "LEADERSHIP_SALARY_ACTIVATED");
        }

        // 3. Travel Tour Fund ($500 Cash): Direct $100,000 + Team $150,000 USD
        if (u.rank < 3 && directVol >= 100_000 * 1e18 && teamVol >= 150_000 * 1e18) {
            u.rank = 3;
            uint256 travelReward = 500 * 1e18;
            userFin[userAddr].mlmEarnedUsd += travelReward;
            userFin[userAddr].mlmAvailableUsd += travelReward;
            emit RankUpgraded(userAddr, 3);
            emit RankRewardPaid(userAddr, 3, travelReward, "TRAVEL_TOUR_FUND");
        }

        // 4. Dream Car Fund ($50,000 Cash): Direct $100,000 + Team $2,000,000 USD
        if (u.rank < 4 && directVol >= 100_000 * 1e18 && teamVol >= 2_000_000 * 1e18) {
            u.rank = 4;
            uint256 carReward = 50000 * 1e18;
            userFin[userAddr].mlmEarnedUsd += carReward;
            userFin[userAddr].mlmAvailableUsd += carReward;
            emit RankUpgraded(userAddr, 4);
            emit RankRewardPaid(userAddr, 4, carReward, "DREAM_CAR_FUND");
        }

        // 5. Luxury House Fund ($100,000 Cash): Direct $100,000 + Team $5,000,000 USD
        if (u.rank < 5 && directVol >= 100_000 * 1e18 && teamVol >= 5_000_000 * 1e18) {
            u.rank = 5;
            uint256 houseReward = 100000 * 1e18;
            userFin[userAddr].mlmEarnedUsd += houseReward;
            userFin[userAddr].mlmAvailableUsd += houseReward;
            emit RankUpgraded(userAddr, 5);
            emit RankRewardPaid(userAddr, 5, houseReward, "LUXURY_HOUSE_FUND");
        }
    }

    // =========================================================================
    // 🌐 4. 2x2 AUTO-SPILLOVER MATRIX PLACEMENT
    // =========================================================================

    function _autoPlaceInMatrix(address newUser) internal {
        if (matrixNodes[newUser].exists) return;

        address parentNode = address(0);
        string memory position = "left";

        while (matrixHead < matrixQueue.length) {
            address currentCandidate = matrixQueue[matrixHead];
            MatrixNode storage node = matrixNodes[currentCandidate];

            if (node.leftChild == address(0)) {
                parentNode = currentCandidate;
                node.leftChild = newUser;
                position = "left";
                break;
            } else if (node.rightChild == address(0)) {
                parentNode = currentCandidate;
                node.rightChild = newUser;
                position = "right";
                matrixHead++;
                break;
            } else {
                matrixHead++;
            }
        }

        matrixNodes[newUser] = MatrixNode({
            userAddress: newUser,
            parent: parentNode,
            leftChild: address(0),
            rightChild: address(0),
            matrixEarningsUsd: 0,
            exists: true
        });
        matrixQueue.push(newUser);
        userStat[newUser].inMatrix = true;

        emit MatrixNodePlaced(newUser, parentNode, position);

        if (parentNode != address(0)) {
            userFin[parentNode].mlmAvailableUsd += MATRIX_PLACEMENT_INCOME;
            userFin[parentNode].mlmEarnedUsd += MATRIX_PLACEMENT_INCOME;
            matrixNodes[parentNode].matrixEarningsUsd += MATRIX_PLACEMENT_INCOME;
            emit MatrixBonusPaid(parentNode, newUser, MATRIX_PLACEMENT_INCOME, "DIRECT_PARENT");

            address currentUpline = matrixNodes[parentNode].parent;
            uint256 uplineShare = (MATRIX_PLACEMENT_INCOME * MATRIX_UPLINE_SHARE_PERCENT) / 100;

            for (uint8 i = 0; i < 10 && currentUpline != address(0); i++) {
                userFin[currentUpline].mlmAvailableUsd += uplineShare;
                userFin[currentUpline].mlmEarnedUsd += uplineShare;
                matrixNodes[currentUpline].matrixEarningsUsd += uplineShare;
                emit MatrixBonusPaid(currentUpline, newUser, uplineShare, "MATRIX_10_UPLINES");
                currentUpline = matrixNodes[currentUpline].parent;
            }
        }
    }

    // =========================================================================
    // 📈 5. PHASE AUTO-SELL EXECUTION (SYSTEM / ADMIN)
    // =========================================================================

    function recordPhaseSell(
        address targetUser,
        uint8 phase,
        uint256 tokensSold,
        uint256 usdtGenerated
    ) external onlyOwner {
        require(targetUser != address(0), "Zero address");
        require(tokensSold > 0 && usdtGenerated > 0, "Invalid amounts");

        VirtualSellAllocation storage alloc = virtualAllocations[targetUser];

        if (phase == 2) alloc.p2SoldTokens += tokensSold;
        else if (phase == 3) alloc.p3SoldTokens += tokensSold;
        else if (phase == 4) alloc.p4SoldTokens += tokensSold;
        else if (phase == 5) alloc.p5SoldTokens += tokensSold;

        UserFinancials storage fin = userFin[targetUser];
        fin.tokenSellEarnedUsd += usdtGenerated;
        fin.tokenSellAvailableUsd += usdtGenerated;
        fin.pendingNxbcToDeduct += tokensSold;

        emit PhaseSellExecuted(targetUser, phase, tokensSold, usdtGenerated);
    }

    // =========================================================================
    // 💵 6. WITHDRAWAL GATEWAYS (DUAL ENGINE)
    // =========================================================================

    function withdrawMlmRewards(uint256 grossUsdAmount) external nonReentrant {
        require(grossUsdAmount > 0, "Amount must be > 0");
        UserFinancials storage fin = userFin[msg.sender];
        require(fin.mlmAvailableUsd >= grossUsdAmount, "Insufficient balance");

        fin.mlmAvailableUsd -= grossUsdAmount;
        fin.totalWithdrawnUsd += grossUsdAmount;

        uint256 fee = (grossUsdAmount * WITHDRAWAL_DEDUCTION_PERCENT) / 100;
        uint256 netPayout = grossUsdAmount - fee;

        if (fee > 0) {
            require(usdtToken.transfer(treasuryWallet, fee), "Fee transfer failed");
        }
        require(usdtToken.transfer(msg.sender, netPayout), "USDT transfer failed");

        emit MlmWithdrawal(msg.sender, grossUsdAmount, netPayout, fee);
    }

    function withdrawTokenSellEarnings(uint256 grossUsdAmount) external nonReentrant {
        require(grossUsdAmount > 0, "Amount must be > 0");
        UserFinancials storage fin = userFin[msg.sender];
        require(fin.tokenSellAvailableUsd >= grossUsdAmount, "Insufficient balance");

        uint256 nxbcToDeduct = 0;
        if (fin.tokenSellAvailableUsd > 0) {
            nxbcToDeduct = (fin.pendingNxbcToDeduct * grossUsdAmount) / fin.tokenSellAvailableUsd;
        }

        fin.tokenSellAvailableUsd -= grossUsdAmount;
        fin.pendingNxbcToDeduct -= nxbcToDeduct;
        fin.totalWithdrawnUsd += grossUsdAmount;

        if (nxbcToDeduct > 0) {
            require(
                nxbcToken.transferFrom(msg.sender, address(this), nxbcToDeduct),
                "NXBC deduction failed"
            );
        }

        uint256 fee = (grossUsdAmount * WITHDRAWAL_DEDUCTION_PERCENT) / 100;
        uint256 netPayout = grossUsdAmount - fee;

        if (fee > 0) {
            require(usdtToken.transfer(treasuryWallet, fee), "Fee transfer failed");
        }
        require(usdtToken.transfer(msg.sender, netPayout), "USDT transfer failed");

        emit TokenSellWithdrawal(msg.sender, grossUsdAmount, netPayout, fee, nxbcToDeduct);
    }

    // =========================================================================
    // 👑 7. ADMIN CONTROLS
    // =========================================================================

    function setPhase(uint8 _phase) external onlyOwner {
        require(phases[_phase].totalSupply > 0, "Phase does not exist");
        currentPhase = _phase;
        phases[_phase].isActive = true;
    }

    function togglePause() external onlyOwner {
        presalePaused = !presalePaused;
    }

    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Zero address");
        treasuryWallet = _treasury;
    }

    function emergencyWithdrawTokens(address tokenAddress, uint256 amount) external onlyOwner {
        IERC20(tokenAddress).transfer(owner(), amount);
    }
}
