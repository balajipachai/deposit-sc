// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "openzeppelin-solidity/contracts/access/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title Ledger
/// @notice Ledger contract that holds USDT Deposits & Transfers
contract Ledger is Ownable {
    using SafeERC20 for IERC20;
    //solhint-disable-next-line var-name-mixedcase
    IERC20 public USDT;

    bool public isWithdrawalAllowed = false;

    mapping(address => uint256) public userDeposits;

    event LogDeposit(address indexed depositor, uint256 amount);
    event LogWithdraw(address indexed withdrawee, uint256 amount);

    modifier canWithdraw() {
        require(isWithdrawalAllowed, "Cannot withdraw");
        _;
    }

    /**
     * @dev Sets the values for {USDT = Mainnet Address}
     *
     * The USDT address can only be set once during
     * construction.
     */
    constructor() {
        USDT = IERC20(0xdAC17F958D2ee523a2206206994597C13D831ec7); // Mainnet USDT address
    }

    /**
     * @dev Contract might receive/hold ETH as part of the maintenance process.
     * The receive function is executed on a call to the contract with empty calldata.
     */
    // solhint-disable-next-line no-empty-blocks
    receive() external payable {}

    fallback() external payable {}

    /**
     * @dev To deposit USDT in the contract
     */
    function deposit(uint256 amount) public {
        require(msg.sender != address(0), "Caller is address zero.");
        require(amount > 0, "Deposit: Amount must be > 0");
        // Pull in tokens from USDT contract
        userDeposits[msg.sender] += amount;
        emit LogDeposit(msg.sender, amount);
        USDT.safeTransferFrom(msg.sender, address(this), amount);
    }

    /**
     * @dev To transfer USDT from contract to EOA
     *
     * Requirements:
     * - can only be invoked by the owner of the contract
     */
    function transfer(address recipient, uint256 amount) public onlyOwner {
        require(amount > 0, "Transfer: Amount must be > 0");
        uint256 balance = USDT.balanceOf(address(this));
        require(balance >= amount, "Transfer: Insufficient balance");
        USDT.safeTransfer(recipient, amount);
    }

    /**
     * @dev To withdraw deposited USDT
     *
     * Requirements:
     * - USDT can only be withdrawn when allowed by Owner
     */
    function withdraw() public canWithdraw {
        uint256 amount = userDeposits[msg.sender];
        require(amount > 0, "Withdraw: No deposits");
        userDeposits[msg.sender] = 0;
        emit LogWithdraw(msg.sender, amount);
        USDT.safeTransfer(msg.sender, amount);
    }

    /**
     * @dev To allow withdrawal for user depositsalloWithdrawal
     *
     * Requirements:
     * - can only be invoked by the owner of the contract
     */
    function toggleWithdrawalStatus() public onlyOwner {
        isWithdrawalAllowed = !isWithdrawalAllowed;
    }
}
