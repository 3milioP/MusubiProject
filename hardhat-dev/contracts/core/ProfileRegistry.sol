// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title ProfileRegistry
 * @dev Registro de perfiles profesionales y empresas con sistema de karma
 * @notice Para este prototipo, los perfiles se registran sin verificación obligatoria
 */
contract ProfileRegistry is AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant KARMA_ROLE = keccak256("KARMA_ROLE");
    bytes32 public constant COMPANY_ROLE = keccak256("COMPANY_ROLE");
    
    struct Profile {
        uint256 id;
        address wallet_addr;
        string name;
        string description;
        string metadataURI;
        ProfileType profileType;
        bool isVerified;
        bool disclaimerAccepted; // Nuevo campo para el disclaimer
        uint256 karma;
        uint256 createdAt;
        uint256 updatedAt;
        uint256 verifiedAt;
        address verifiedBy;
    }
    
    enum ProfileType { Professional, Company }
    
    mapping(address => Profile) public profiles;
    mapping(uint256 => address) public profileById;
    address[] public profileAddresses;
    
    uint256 private _profileIdCounter;
    
    event ProfileRegistered(uint256 indexed profileId, address indexed wallet, ProfileType profileType);
    event ProfileUpdated(uint256 indexed profileId, address indexed wallet);
    event ProfileVerified(uint256 indexed profileId, address indexed wallet, address indexed verifier);
    event KarmaUpdated(uint256 indexed profileId, address indexed wallet, uint256 newKarma);
    event DisclaimerAccepted(uint256 indexed profileId, address indexed wallet);
    
    modifier onlyProfileOwner(address wallet) {
        require(profiles[wallet].wallet_addr == wallet, "Profile not found");
        _;
    }
    
    modifier onlyRegisteredProfile(address wallet) {
        require(profiles[wallet].wallet_addr != address(0), "Profile not registered");
        _;
    }
    
    modifier onlyVerifiedProfile(address wallet) {
        require(profiles[wallet].isVerified, "Profile not verified");
        _;
    }
    
    modifier onlyProfessional(address wallet) {
        require(profiles[wallet].profileType == ProfileType.Professional, "Only professionals can perform this action");
        _;
    }
    
    modifier onlyCompany(address wallet) {
        require(profiles[wallet].profileType == ProfileType.Company, "Only companies can perform this action");
        _;
    }
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
        _grantRole(KARMA_ROLE, msg.sender);
    }
    
    /**
     * @dev Registra un nuevo perfil (sin verificación obligatoria para prototipo)
     * @param name Nombre del perfil
     * @param description Descripción del perfil
     * @param metadataURI URI de metadatos (opcional)
     * @param profileType Tipo de perfil (Professional o Company)
     * @param acceptDisclaimer Aceptación del disclaimer
     */
    function registerProfile(
        string calldata name,
        string calldata description,
        string calldata metadataURI,
        ProfileType profileType,
        bool acceptDisclaimer
    ) external whenNotPaused nonReentrant {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(profiles[msg.sender].wallet_addr == address(0), "Profile already exists");
        require(acceptDisclaimer, "Disclaimer must be accepted");
        
        uint256 profileId = _profileIdCounter++;
        
        profiles[msg.sender] = Profile({
            id: profileId,
            wallet_addr: msg.sender,
            name: name,
            description: description,
            metadataURI: metadataURI,
            profileType: profileType,
            isVerified: false, // Para prototipo, no requiere verificación
            disclaimerAccepted: true,
            karma: 0,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            verifiedAt: 0,
            verifiedBy: address(0)
        });
        
        profileById[profileId] = msg.sender;
        profileAddresses.push(msg.sender);
        
        emit ProfileRegistered(profileId, msg.sender, profileType);
        emit DisclaimerAccepted(profileId, msg.sender);
    }
    
    /**
     * @dev Actualiza un perfil existente
     * @param name Nuevo nombre
     * @param description Nueva descripción
     * @param metadataURI Nueva URI de metadatos
     */
    function updateProfile(
        string calldata name,
        string calldata description,
        string calldata metadataURI
    ) external whenNotPaused onlyProfileOwner(msg.sender) {
        require(bytes(name).length > 0, "Name cannot be empty");
        
        Profile storage profile = profiles[msg.sender];
        profile.name = name;
        profile.description = description;
        profile.metadataURI = metadataURI;
        profile.updatedAt = block.timestamp;
        
        emit ProfileUpdated(profile.id, msg.sender);
    }
    
    /**
     * @dev Verifica un perfil (opcional para prototipo)
     * @param wallet Dirección del perfil a verificar
     */
    function verifyProfile(address wallet) external whenNotPaused onlyRole(VERIFIER_ROLE) {
        require(profiles[wallet].wallet_addr != address(0), "Profile not found");
        require(!profiles[wallet].isVerified, "Profile already verified");
        require(wallet != msg.sender, "Cannot verify own profile");
        
        Profile storage profile = profiles[wallet];
        profile.isVerified = true;
        profile.verifiedAt = block.timestamp;
        profile.verifiedBy = msg.sender;
        
        emit ProfileVerified(profile.id, wallet, msg.sender);
    }
    
    /**
     * @dev Actualiza el karma de un perfil (solo roles autorizados)
     * @param wallet Dirección del perfil
     * @param newKarma Nuevo valor de karma
     */
    function updateKarma(address wallet, uint256 newKarma) external onlyRole(KARMA_ROLE) {
        require(profiles[wallet].wallet_addr != address(0), "Profile not found");
        
        Profile storage profile = profiles[wallet];
        profile.karma = newKarma;
        profile.updatedAt = block.timestamp;
        
        emit KarmaUpdated(profile.id, wallet, newKarma);
    }
    
    /**
     * @dev Obtiene un perfil por dirección
     * @param wallet Dirección del perfil
     */
    function getProfile(address wallet) external view returns (Profile memory) {
        return profiles[wallet];
    }
    
    /**
     * @dev Obtiene un perfil por ID
     * @param profileId ID del perfil
     */
    function getProfileById(uint256 profileId) external view returns (Profile memory) {
        address wallet = profileById[profileId];
        require(wallet != address(0), "Profile not found");
        return profiles[wallet];
    }
    
    /**
     * @dev Verifica si una dirección tiene un perfil
     * @param wallet Dirección a verificar
     */
    function hasProfile(address wallet) external view returns (bool) {
        return profiles[wallet].wallet_addr != address(0);
    }
    
    /**
     * @dev Verifica si una dirección tiene un perfil verificado
     * @param wallet Dirección a verificar
     */
    function hasVerifiedProfile(address wallet) external view returns (bool) {
        return profiles[wallet].isVerified;
    }
    
    /**
     * @dev Verifica si una dirección tiene un perfil registrado (para prototipo)
     * @param wallet Dirección a verificar
     */
    function hasRegisteredProfile(address wallet) external view returns (bool) {
        return profiles[wallet].wallet_addr != address(0);
    }
    
    /**
     * @dev Obtiene todos los perfiles
     */
    function getAllProfiles() external view returns (address[] memory) {
        return profileAddresses;
    }
    
    /**
     * @dev Obtiene el número total de perfiles
     */
    function getProfileCount() external view returns (uint256) {
        return _profileIdCounter;
    }
    
    /**
     * @dev Obtiene perfiles por tipo
     * @param profileType Tipo de perfil a filtrar
     */
    function getProfilesByType(ProfileType profileType) external view returns (address[] memory) {
        address[] memory filteredProfiles = new address[](profileAddresses.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < profileAddresses.length; i++) {
            if (profiles[profileAddresses[i]].profileType == profileType) {
                filteredProfiles[count] = profileAddresses[i];
                count++;
            }
        }
        
        // Redimensionar el array al tamaño real
        address[] memory result = new address[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = filteredProfiles[i];
        }
        
        return result;
    }
    
    /**
     * @dev Pausa el contrato (solo admin)
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @dev Despausa el contrato (solo admin)
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}
