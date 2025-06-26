// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./IPFSRegistry.sol";

/**
 * @title ProfileRegistry
 * @dev Registro de perfiles de usuarios con datos almacenados en IPFS
 * Solo almacena hashes de IPFS y referencias, no datos personales
 */
contract ProfileRegistry is AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant KARMA_ROLE = keccak256("KARMA_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    
    IPFSRegistry public ipfsRegistry;
    
    enum ProfileType { Individual, Professional, Company }
    enum ProfileStatus { Pending, Active, Suspended, Deleted }
    
    struct Profile {
        address wallet;
        string profileDataHash; // Hash de IPFS con datos del perfil
        ProfileType profileType;
        ProfileStatus status;
        uint256 karmaScore;
        uint256 createdAt;
        uint256 updatedAt;
        uint256 verifiedAt;
        address verifiedBy;
    }
    
    mapping(address => Profile) public profiles;
    mapping(address => bool) public hasRegisteredProfile;
    mapping(address => bool) public hasVerifiedProfile;
    
    uint256 public totalProfiles;
    uint256 public totalVerifiedProfiles;
    
    event ProfileRegistered(address indexed wallet, string profileDataHash, ProfileType profileType);
    event ProfileUpdated(address indexed wallet, string newProfileDataHash);
    event ProfileVerified(address indexed wallet, address indexed verifier, uint256 karmaScore);
    event ProfileStatusChanged(address indexed wallet, ProfileStatus newStatus);
    event KarmaScoreUpdated(address indexed wallet, uint256 newKarmaScore);
    
    modifier onlyRegisteredUser(address user) {
        require(hasRegisteredProfile[user], "Profile not registered");
        _;
    }
    
    modifier onlyVerifiedUser(address user) {
        require(hasVerifiedProfile[user], "Profile not verified");
        _;
    }
    
    modifier onlyProfileOwner(address user) {
        require(profiles[user].wallet == msg.sender, "Not profile owner");
        _;
    }
    
    modifier onlyActiveProfile(address user) {
        require(profiles[user].status == ProfileStatus.Active, "Profile not active");
        _;
    }
    
    constructor(address _ipfsRegistry) {
        require(_ipfsRegistry != address(0), "IPFSRegistry address cannot be zero");
        
        ipfsRegistry = IPFSRegistry(_ipfsRegistry);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(KARMA_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
    }
    
    /**
     * @dev Registra un nuevo perfil con datos en IPFS
     * @param profileDataHash Hash de IPFS con los datos del perfil
     * @param profileType Tipo de perfil
     */
    function registerProfile(string calldata profileDataHash, ProfileType profileType) external whenNotPaused nonReentrant {
        require(!hasRegisteredProfile[msg.sender], "Profile already registered");
        require(bytes(profileDataHash).length > 0, "Profile data hash cannot be empty");
        require(profileType != ProfileType.Individual || profileType != ProfileType.Professional || profileType != ProfileType.Company, "Invalid profile type");
        
        // Verificar que el hash existe en IPFSRegistry
        require(ipfsRegistry.hashExists(profileDataHash), "Profile data not found in IPFS");
        
        profiles[msg.sender] = Profile({
            wallet: msg.sender,
            profileDataHash: profileDataHash,
            profileType: profileType,
            status: ProfileStatus.Pending,
            karmaScore: 0,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            verifiedAt: 0,
            verifiedBy: address(0)
        });
        
        hasRegisteredProfile[msg.sender] = true;
        totalProfiles++;
        
        emit ProfileRegistered(msg.sender, profileDataHash, profileType);
    }
    
    /**
     * @dev Actualiza los datos del perfil (solo propietario)
     * @param newProfileDataHash Nuevo hash de IPFS con datos actualizados
     */
    function updateProfile(string calldata newProfileDataHash) external whenNotPaused onlyRegisteredUser(msg.sender) onlyActiveProfile(msg.sender) {
        require(bytes(newProfileDataHash).length > 0, "Profile data hash cannot be empty");
        require(ipfsRegistry.hashExists(newProfileDataHash), "Profile data not found in IPFS");
        
        Profile storage profile = profiles[msg.sender];
        profile.profileDataHash = newProfileDataHash;
        profile.updatedAt = block.timestamp;
        
        // Si el perfil estaba verificado, requiere nueva verificación
        if (hasVerifiedProfile[msg.sender]) {
            hasVerifiedProfile[msg.sender] = false;
            totalVerifiedProfiles--;
            profile.verifiedAt = 0;
            profile.verifiedBy = address(0);
        }
        
        emit ProfileUpdated(msg.sender, newProfileDataHash);
    }
    
    /**
     * @dev Verifica un perfil (solo verificadores autorizados)
     * @param user Dirección del usuario a verificar
     * @param karmaScore Puntuación de karma inicial
     */
    function verifyProfile(address user, uint256 karmaScore) external whenNotPaused onlyRole(VERIFIER_ROLE) onlyRegisteredUser(user) {
        require(!hasVerifiedProfile[user], "Profile already verified");
        require(profiles[user].status == ProfileStatus.Active, "Profile not active");
        require(user != msg.sender, "Cannot verify own profile");
        
        Profile storage profile = profiles[user];
        profile.status = ProfileStatus.Active;
        profile.karmaScore = karmaScore;
        profile.verifiedAt = block.timestamp;
        profile.verifiedBy = msg.sender;
        
        hasVerifiedProfile[user] = true;
        totalVerifiedProfiles++;
        
        emit ProfileVerified(user, msg.sender, karmaScore);
    }
    
    /**
     * @dev Cambia el estado de un perfil (solo admin)
     * @param user Dirección del usuario
     * @param newStatus Nuevo estado
     */
    function changeProfileStatus(address user, ProfileStatus newStatus) external whenNotPaused onlyRole(DEFAULT_ADMIN_ROLE) onlyRegisteredUser(user) {
        Profile storage profile = profiles[user];
        profile.status = newStatus;
        profile.updatedAt = block.timestamp;
        
        // Si se suspende o elimina, remover verificación
        if (newStatus == ProfileStatus.Suspended || newStatus == ProfileStatus.Deleted) {
            if (hasVerifiedProfile[user]) {
                hasVerifiedProfile[user] = false;
                totalVerifiedProfiles--;
            }
        }
        
        emit ProfileStatusChanged(user, newStatus);
    }
    
    /**
     * @dev Actualiza la puntuación de karma (solo rol KARMA)
     * @param user Dirección del usuario
     * @param newKarmaScore Nueva puntuación de karma
     */
    function updateKarmaScore(address user, uint256 newKarmaScore) external whenNotPaused onlyRole(KARMA_ROLE) onlyRegisteredUser(user) {
        Profile storage profile = profiles[user];
        profile.karmaScore = newKarmaScore;
        profile.updatedAt = block.timestamp;
        
        emit KarmaScoreUpdated(user, newKarmaScore);
    }
    
    /**
     * @dev Obtiene el perfil completo de un usuario
     * @param user Dirección del usuario
     */
    function getProfile(address user) external view returns (Profile memory) {
        require(hasRegisteredProfile[user], "Profile not registered");
        return profiles[user];
    }
    
    /**
     * @dev Obtiene solo el hash de datos del perfil
     * @param user Dirección del usuario
     */
    function getProfileDataHash(address user) external view returns (string memory) {
        require(hasRegisteredProfile[user], "Profile not registered");
        return profiles[user].profileDataHash;
    }
    
    /**
     * @dev Obtiene la puntuación de karma de un usuario
     * @param user Dirección del usuario
     */
    function getKarmaScore(address user) external view returns (uint256) {
        require(hasRegisteredProfile[user], "Profile not registered");
        return profiles[user].karmaScore;
    }
    
    /**
     * @dev Obtiene el tipo de perfil de un usuario
     * @param user Dirección del usuario
     */
    function getProfileType(address user) external view returns (ProfileType) {
        require(hasRegisteredProfile[user], "Profile not registered");
        return profiles[user].profileType;
    }
    
    /**
     * @dev Obtiene el estado del perfil de un usuario
     * @param user Dirección del usuario
     */
    function getProfileStatus(address user) external view returns (ProfileStatus) {
        require(hasRegisteredProfile[user], "Profile not registered");
        return profiles[user].status;
    }
    
    /**
     * @dev Pausa el contrato (solo admin)
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @dev Reanuda el contrato (solo admin)
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}
