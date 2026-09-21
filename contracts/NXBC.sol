// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract NXBC {
    string public constant name = "NXBC";
    string public constant symbol = "NXBC";
    uint8 public constant decimals = 18;

    uint256 public constant TOTAL_SUPPLY = 70_000_000 * 10 ** 18;
    uint256 public totalSupply = TOTAL_SUPPLY;

    address public owner;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    address public pancakePair;
    bool public tradingOpen = false;
    mapping(address => bool) public isExcludedFromRestrictions;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event OwnershipTransferred(address indexed oldOwner, address indexed newOwner);
    event PancakePairUpdated(address indexed pair);
    event TradingEnabled();
    event TradingDisabled();
    event ExclusionUpdated(address indexed account, bool excluded);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        balanceOf[msg.sender] = TOTAL_SUPPLY;
        emit Transfer(address(0), msg.sender, TOTAL_SUPPLY);
    }

    function setPancakePair(address pair) external onlyOwner {
        require(pair != address(0), "Invalid pair");
        pancakePair = pair;
        emit PancakePairUpdated(pair);
    }

    function setExcludedAddress(address account, bool excluded) external onlyOwner {
        require(account != address(0), "Invalid address");
        isExcludedFromRestrictions[account] = excluded;
        emit ExclusionUpdated(account, excluded);
    }

    function enableTrading() external onlyOwner {
        tradingOpen = true;
        emit TradingEnabled();
    }

    function disableTrading() external onlyOwner {
        tradingOpen = false;
        emit TradingDisabled();
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        require(spender != address(0), "Invalid spender");
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 currentAllowance = allowance[from][msg.sender];
        require(currentAllowance >= amount, "Insufficient allowance");
        allowance[from][msg.sender] = currentAllowance - amount;
        emit Approval(from, to, allowance[from][msg.sender]);
        _transfer(from, to, amount);
        return true;
    }

    function _transfer(address from, address to, uint256 amount) internal {
        require(from != address(0), "Invalid sender");
        require(to != address(0), "Invalid recipient");
        require(balanceOf[from] >= amount, "Insufficient balance");

        if (
            !tradingOpen &&
            pancakePair != address(0) &&
            (from == pancakePair || to == pancakePair)
        ) {
            require(
                isExcludedFromRestrictions[from] || isExcludedFromRestrictions[to],
                "Trading not open"
            );
        }

        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid owner");
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}
