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
        require(newFee <= 1000, "Fee too high"); // Máximo 10%
        reflectionFee = newFee;
        emit ReflectionFeeUpdated(newFee);
    }

    function updateTreasuryWallet(address newTreasury) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newTreasury != address(0), "Treasury cannot be zero address");
        treasuryWallet = newTreasury;
        emit TreasuryWalletUpdated(newTreasury);
    }

    function transfer(address to, uint256 amount) public override returns (bool) {
        address owner = _msgSender();
        
        // No aplicar comisión si es el treasury, minter, o transferencia a treasury
        if (owner == treasuryWallet || to == treasuryWallet || hasRole(MINTER_ROLE, owner) || hasRole(MINTER_ROLE, to)) {
            _transfer(owner, to, amount);
            return true;
        }

        // Aplicar comisión de reflexión
        uint256 fee = (amount * reflectionFee) / 10000;
        uint256 netAmount = amount - fee;

        _transfer(owner, treasuryWallet, fee);
        _transfer(owner, to, netAmount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        address spender = _msgSender();
        _spendAllowance(from, spender, amount);

        // No aplicar comisión si es el treasury, minter, o transferencia a treasury
        if (from == treasuryWallet || to == treasuryWallet || hasRole(MINTER_ROLE, from) || hasRole(MINTER_ROLE, to)) {
            _transfer(from, to, amount);
            return true;
        }

        // Aplicar comisión de reflexión
        uint256 fee = (amount * reflectionFee) / 10000;
        uint256 netAmount = amount - fee;

        _transfer(from, treasuryWallet, fee);
        _transfer(from, to, netAmount);
        return true;
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual override(ERC20, ERC20Pausable) {
        super._beforeTokenTransfer(from, to, amount);
    }
}

