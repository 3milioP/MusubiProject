// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title KRMToken
 * @dev Implementa el token Karma (KRM) para el ecosistema Musubi
 */
contract KRMToken is ERC20, ERC20Burnable, ERC20Pausable, AccessControl {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18;

    // Comisión por reflexión (base 10000)
    uint256 public reflectionFee = 100; // 1%
    address public treasuryWallet;

    event ReflectionFeeUpdated(uint256 newFee);
    event TreasuryWalletUpdated(address newTreasury);

    constructor(address _treasuryWallet) ERC20("Karma Token", "KRM") {
        require(_treasuryWallet != address(0), "Treasury cannot be zero address");

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);

        treasuryWallet = _treasuryWallet;

        // Mint inicial del 10% al tesoro
        _mint(_treasuryWallet, MAX_SUPPLY / 10);
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function updateReflectionFee(uint256 newFee) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newFee <= 500, "Fee too high"); // Máximo 5%
        reflectionFee = newFee;
        emit ReflectionFeeUpdated(newFee);
    }

    function updateTreasuryWallet(address newTreasury) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newTreasury != address(0), "Treasury cannot be zero address");
        treasuryWallet = newTreasury;
        emit TreasuryWalletUpdated(newTreasury);
    }

    function transfer(address to, uint256 amount) public override returns (bool) {
        if (!hasRole(MINTER_ROLE, msg.sender) && !hasRole(MINTER_ROLE, to)) {
            require(to != treasuryWallet && msg.sender != treasuryWallet, "No reflection with treasury");

            uint256 fee = (amount * reflectionFee) / 10000;
            uint256 netAmount = amount - fee;

            _transfer(msg.sender, treasuryWallet, fee);
            _transfer(msg.sender, to, netAmount);
            return true;
        } else {
            return super.transfer(to, amount);
        }
    }

    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        if (!hasRole(MINTER_ROLE, from) && !hasRole(MINTER_ROLE, to)) {
            require(to != treasuryWallet && from != treasuryWallet, "No reflection with treasury");

            uint256 fee = (amount * reflectionFee) / 10000;
            uint256 netAmount = amount - fee;

            _spendAllowance(from, _msgSender(), amount);
            _transfer(from, treasuryWallet, fee);
            _transfer(from, to, netAmount);
            return true;
        } else {
            return super.transferFrom(from, to, amount);
        }
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual override(ERC20, ERC20Pausable) {
        super._beforeTokenTransfer(from, to, amount);

        if (from != address(0) && to != address(0)) {
            if (!hasRole(MINTER_ROLE, from) && !hasRole(MINTER_ROLE, to)) {
                require(to != treasuryWallet && from != treasuryWallet, "No reflection with treasury");

                uint256 fee = (amount * reflectionFee) / 10000;
                _transfer(from, treasuryWallet, fee);
            }
        }
    }
}
