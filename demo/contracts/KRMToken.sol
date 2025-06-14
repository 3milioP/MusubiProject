// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title KRMToken
 * @dev Implementa el token Karma (KRM) para el ecosistema Musubi
 */
contract KRMToken is ERC20, ERC20Burnable, Pausable, AccessControl {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    // Límites y parámetros
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1 billón de tokens
    
    // Reflexión para el marketplace P2P
    uint256 public reflectionFee = 100; // 1% (base 10000)
    address public treasuryWallet;
    
    /**
     * @dev Constructor
     * @param _treasuryWallet Dirección del tesoro para recibir comisiones
     */
    constructor(address _treasuryWallet) ERC20("Karma Token", "KRM") {
        require(_treasuryWallet != address(0), "Treasury cannot be zero address");
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        
        treasuryWallet = _treasuryWallet;
        
        // Mint inicial para el tesoro (10% del suministro máximo)
        _mint(_treasuryWallet, MAX_SUPPLY / 10);
    }
    
    /**
     * @dev Acuña nuevos tokens (solo minters)
     * @param to Dirección del receptor
     * @param amount Cantidad a acuñar
     */
    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
    }
    
    /**
     * @dev Pausa todas las transferencias de tokens (solo pausers)
     */
    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }
    
    /**
     * @dev Reanuda todas las transferencias de tokens (solo pausers)
     */
    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Actualiza la tarifa de reflexión (solo admin)
     * @param newFee Nueva tarifa (base 10000)
     */
    function updateReflectionFee(uint256 newFee) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newFee <= 500, "Fee too high"); // Máximo 5%
        reflectionFee = newFee;
    }
    
    /**
     * @dev Actualiza la dirección del tesoro (solo admin)
     * @param newTreasury Nueva dirección del tesoro
     */
    function updateTreasuryWallet(address newTreasury) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newTreasury != address(0), "Treasury cannot be zero address");
        treasuryWallet = newTreasury;
    }
    
    /**
     * @dev Sobrescribe _beforeTokenTransfer para implementar pausa
     */
    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        whenNotPaused
        override
    {
        super._beforeTokenTransfer(from, to, amount);
    }
    
    /**
     * @dev Sobrescribe transfer para implementar reflexión
     * @param to Dirección del receptor
     * @param amount Cantidad a transferir
     */
    function transfer(address to, uint256 amount) public override returns (bool) {
        // Si es una transferencia normal (no desde/hacia contratos del sistema)
        if (!hasRole(MINTER_ROLE, msg.sender) && !hasRole(MINTER_ROLE, to)) {
            uint256 fee = (amount * reflectionFee) / 10000;
            uint256 netAmount = amount - fee;
            
            super.transfer(treasuryWallet, fee);
            return super.transfer(to, netAmount);
        } else {
            return super.transfer(to, amount);
        }
    }
    
    /**
     * @dev Sobrescribe transferFrom para implementar reflexión
     * @param from Dirección del emisor
     * @param to Dirección del receptor
     * @param amount Cantidad a transferir
     */
    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        // Si es una transferencia normal (no desde/hacia contratos del sistema)
        if (!hasRole(MINTER_ROLE, from) && !hasRole(MINTER_ROLE, to)) {
            uint256 fee = (amount * reflectionFee) / 10000;
            uint256 netAmount = amount - fee;
            
            super.transferFrom(from, treasuryWallet, fee);
            return super.transferFrom(from, to, netAmount);
        } else {
            return super.transferFrom(from, to, amount);
        }
    }
}
