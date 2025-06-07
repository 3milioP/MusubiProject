// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title ProfileRegistry
 * @dev Gestiona los perfiles de profesionales y empresas en la red Musubi
 */
contract ProfileRegistry is AccessControl, Pausable {
    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    
    // Estructuras
    struct Profile {
        address wallet;
        bool isActive;
        bool isCompany;
        uint256 karma;
        string metadataURI;
        uint256 createdAt;
        uint256 updatedAt;
    }
    
    // Mappings
    mapping(address => Profile) public profiles;
    mapping(address => bool) public verifiedProfiles;
    
    // Eventos
    event ProfileRegistered(address indexed wallet, bool isCompany);
    event ProfileUpdated(address indexed wallet);
    event ProfileVerified(address indexed wallet, address indexed verifier);
    
    /**
     * @dev Constructor
     */
    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(VERIFIER_ROLE, msg.sender);
    }
    
    /**
     * @dev Registra un nuevo perfil profesional o empresarial
     * @param isCompany Indica si el perfil es de una empresa
     * @param metadataURI URI de los metadatos del perfil (IPFS)
     */
    function registerProfile(bool isCompany, string calldata metadataURI) external {
        require(profiles[msg.sender].wallet == address(0), "Profile already exists");
        
        profiles[msg.sender] = Profile({
            wallet: msg.sender,
            isActive: true,
            isCompany: isCompany,
            karma: 0,
            metadataURI: metadataURI,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });
        
        emit ProfileRegistered(msg.sender, isCompany);
    }
    
    /**
     * @dev Actualiza los metadatos de un perfil existente
     * @param metadataURI Nueva URI de los metadatos del perfil
     */
    function updateProfile(string calldata metadataURI) external {
        require(profiles[msg.sender].wallet != address(0), "Profile does not exist");
        
        profiles[msg.sender].metadataURI = metadataURI;
        profiles[msg.sender].updatedAt = block.timestamp;
        
        emit ProfileUpdated(msg.sender);
    }
    
    /**
     * @dev Verifica un perfil (solo verificadores autorizados)
     * @param wallet Dirección del perfil a verificar
     */
    function verifyProfile(address wallet) external onlyRole(VERIFIER_ROLE) {
        require(profiles[wallet].wallet != address(0), "Profile does not exist");
        require(!verifiedProfiles[wallet], "Profile already verified");
        
        verifiedProfiles[wallet] = true;
        
        emit ProfileVerified(wallet, msg.sender);
    }
    
    /**
     * @dev Actualiza el karma de un perfil (solo contratos autorizados)
     * @param wallet Dirección del perfil
     * @param karma Nuevo valor de karma
     */
    function updateKarma(address wallet, uint256 karma) external onlyRole(ADMIN_ROLE) {
        require(profiles[wallet].wallet != address(0), "Profile does not exist");
        
        profiles[wallet].karma = karma;
        profiles[wallet].updatedAt = block.timestamp;
    }
    
    /**
     * @dev Desactiva un perfil (solo admin)
     * @param wallet Dirección del perfil a desactivar
     */
    function deactivateProfile(address wallet) external onlyRole(ADMIN_ROLE) {
        require(profiles[wallet].wallet != address(0), "Profile does not exist");
        
        profiles[wallet].isActive = false;
        profiles[wallet].updatedAt = block.timestamp;
    }
    
    /**
     * @dev Pausa el contrato (solo admin)
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @dev Reanuda el contrato (solo admin)
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
}
