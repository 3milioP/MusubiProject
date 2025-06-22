// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../core/ProfileRegistry.sol";
import "../core/SkillSystem.sol";

/**
 * @title ProfileNFT
 * @dev NFT evolutivo que representa la "build" del usuario con sus skills validadas
 * El NFT evoluciona automáticamente cuando se validan nuevas habilidades
 */
contract ProfileNFT is ERC721, ERC721URIStorage, AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant EVOLVER_ROLE = keccak256("EVOLVER_ROLE");
    
    ProfileRegistry public profileRegistry;
    SkillSystem public skillSystem;
    
    struct UserBuild {
        uint256 tokenId;
        address user;
        uint256[] validatedSkillIds;
        uint256 totalKarma;
        uint256 validatedSkillsCount;
        uint256 totalHours;
        uint256 evolutionLevel;
        uint256 lastEvolution;
        string buildType; // "Mago del Código", "Diseñador Visual", "Analista de Datos", etc.
        string metadataURI;
        uint256 mintedAt;
        uint256 lastUpdated;
    }
    
    mapping(uint256 => UserBuild) public userBuilds;
    mapping(address => uint256) public userToTokenId;
    mapping(uint256 => address) public tokenIdToUser;
    
    uint256 private _tokenIdCounter = 1;
    
    event BuildMinted(uint256 indexed tokenId, address indexed user, string buildType);
    event BuildEvolved(uint256 indexed tokenId, address indexed user, uint256 newLevel, string newBuildType);
    event BuildUpdated(uint256 indexed tokenId, address indexed user);
    
    modifier onlyRegisteredUser(address user) {
        require(profileRegistry.hasRegisteredProfile(user), "User profile not registered");
        _;
    }
    
    modifier onlyVerifiedUser(address user) {
        require(profileRegistry.hasVerifiedProfile(user), "User profile not verified");
        _;
    }
    
    modifier onlyBuildOwner(uint256 tokenId) {
        require(ownerOf(tokenId) == msg.sender, "Not build owner");
        _;
    }
    
    modifier onlyBuildExists(uint256 tokenId) {
        require(_exists(tokenId), "Build does not exist");
        _;
    }
    
    constructor(address _profileRegistry, address _skillSystem) ERC721("Musubi Build", "MUSUBUILD") {
        require(_profileRegistry != address(0), "ProfileRegistry address cannot be zero");
        
        profileRegistry = ProfileRegistry(_profileRegistry);
        skillSystem = SkillSystem(_skillSystem); // Puede ser address(0) para prototipo
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(EVOLVER_ROLE, msg.sender);
    }
    
    /**
     * @dev Mintea un NFT de build para un usuario (solo minter autorizado)
     * @param user Dirección del usuario
     * @param metadataURI URI de los metadatos del NFT
     */
    function mintBuild(address user, string calldata metadataURI) external onlyRole(MINTER_ROLE) whenNotPaused onlyRegisteredUser(user) nonReentrant {
        require(userToTokenId[user] == 0, "User already has a build");
        require(bytes(metadataURI).length > 0, "Metadata URI cannot be empty");
        
        uint256 tokenId = _tokenIdCounter++;
        
        // Calcular build inicial basado en skills existentes
        (uint256[] memory skillIds, uint256 karma, uint256 _hours, string memory buildType) = _calculateUserBuild(user);
        
        userBuilds[tokenId] = UserBuild({
            tokenId: tokenId,
            user: user,
            validatedSkillIds: skillIds,
            totalKarma: karma,
            validatedSkillsCount: skillIds.length,
            totalHours: _hours,
            evolutionLevel: _calculateEvolutionLevel(karma, skillIds.length),
            lastEvolution: block.timestamp,
            buildType: buildType,
            metadataURI: metadataURI,
            mintedAt: block.timestamp,
            lastUpdated: block.timestamp
        });
        
        userToTokenId[user] = tokenId;
        tokenIdToUser[tokenId] = user;
        
        _safeMint(user, tokenId);
        _setTokenURI(tokenId, metadataURI);
        
        emit BuildMinted(tokenId, user, buildType);
    }
    
    /**
     * @dev Evoluciona el build de un usuario cuando se validan nuevas skills
     * @param user Dirección del usuario
     */
    function evolveBuild(address user) external onlyRole(EVOLVER_ROLE) whenNotPaused {
        uint256 tokenId = userToTokenId[user];
        require(tokenId != 0, "User has no build");
        
        UserBuild storage build = userBuilds[tokenId];
        
        // Recalcular build con skills actualizadas
        (uint256[] memory newSkillIds, uint256 newKarma, uint256 newTotalHours, string memory newBuildType) = _calculateUserBuild(user);
        
        uint256 newEvolutionLevel = _calculateEvolutionLevel(newKarma, newSkillIds.length);
        
        // Solo evolucionar si hay cambios significativos
        if (newEvolutionLevel > build.evolutionLevel || 
            newSkillIds.length > build.validatedSkillsCount ||
            keccak256(bytes(newBuildType)) != keccak256(bytes(build.buildType))) {
            
            build.validatedSkillIds = newSkillIds;
            build.totalKarma = newKarma;
            build.validatedSkillsCount = newSkillIds.length;
            build.totalHours = newTotalHours;
            build.evolutionLevel = newEvolutionLevel;
            build.lastEvolution = block.timestamp;
            build.buildType = newBuildType;
            build.lastUpdated = block.timestamp;
            
            emit BuildEvolved(tokenId, user, newEvolutionLevel, newBuildType);
        }
    }
    
    /**
     * @dev Actualiza manualmente el metadataURI del build (solo propietario)
     * @param tokenId ID del token
     * @param newMetadataURI Nueva URI de metadatos
     */
    function updateBuildMetadata(uint256 tokenId, string calldata newMetadataURI) external onlyBuildOwner(tokenId) whenNotPaused {
        require(bytes(newMetadataURI).length > 0, "Metadata URI cannot be empty");
        
        userBuilds[tokenId].metadataURI = newMetadataURI;
        userBuilds[tokenId].lastUpdated = block.timestamp;
        _setTokenURI(tokenId, newMetadataURI);
        
        emit BuildUpdated(tokenId, msg.sender);
    }
    
    /**
     * @dev Obtiene el build completo de un usuario
     * @param user Dirección del usuario
     */
    function getUserBuild(address user) external view returns (UserBuild memory) {
        uint256 tokenId = userToTokenId[user];
        require(tokenId != 0, "User has no build");
        return userBuilds[tokenId];
    }
    
    /**
     * @dev Obtiene el build por ID de token
     * @param tokenId ID del token
     */
    function getBuild(uint256 tokenId) external view onlyBuildExists(tokenId) returns (UserBuild memory) {
        return userBuilds[tokenId];
    }
    
    /**
     * @dev Verifica si un usuario tiene un build
     * @param user Dirección del usuario
     */
    function hasBuild(address user) external view returns (bool) {
        return userToTokenId[user] != 0;
    }
    
    /**
     * @dev Obtiene el ID del token de build de un usuario
     * @param user Dirección del usuario
     */
    function getBuildTokenId(address user) external view returns (uint256) {
        return userToTokenId[user];
    }
    
    /**
     * @dev Quema el build (solo propietario o minter)
     * @param tokenId ID del token
     */
    function burnBuild(uint256 tokenId) external {
        require(_isApprovedOrOwner(msg.sender, tokenId) || hasRole(MINTER_ROLE, msg.sender), "Not authorized to burn");
        
        address user = tokenIdToUser[tokenId];
        delete userToTokenId[user];
        delete tokenIdToUser[tokenId];
        delete userBuilds[tokenId];
        
        _burn(tokenId);
    }
    
    /**
     * @dev Obtiene el número total de builds minteados
     */
    function getBuildCount() external view returns (uint256) {
        return _tokenIdCounter;
    }
    
    /**
     * @dev Calcula el build de un usuario basado en sus skills validadas
     * @param user Dirección del usuario
     */
    function _calculateUserBuild(address user) internal view returns (uint256[] memory skillIds, uint256 karma, uint256 _hours, string memory buildType) {
        // Si no hay SkillSystem configurado, crear build básico
        if (address(skillSystem) == address(0)) {
            uint256[] memory emptySkills = new uint256[](0);
            return (emptySkills, 0, 0, "Novato");
        }
        
        // Obtener skills del usuario
        uint256[] memory allSkillIds = skillSystem.getProfessionalSkills(user);
        uint256[] memory validatedSkillIds = new uint256[](allSkillIds.length);
        uint256 validatedCount = 0;
        uint256 totalKarma = 0;
        
        // Filtrar solo habilidades validadas
        for (uint256 i = 0; i < allSkillIds.length; i++) {
            SkillSystem.DeclaredSkill memory declaredSkill = skillSystem.getDeclaredSkill(user, allSkillIds[i]);
            if (declaredSkill.isValidated) {
                validatedSkillIds[validatedCount] = allSkillIds[i];
                validatedCount++;
                totalKarma += declaredSkill.level * 10; // Karma por nivel
            }
        }
        
        // Crear array con solo habilidades validadas
        uint256[] memory finalSkillIds = new uint256[](validatedCount);
        for (uint256 i = 0; i < validatedCount; i++) {
            finalSkillIds[i] = validatedSkillIds[i];
        }
        
        // Determinar tipo de build basado en skills
        buildType = _determineBuildType(finalSkillIds);
        
        return (finalSkillIds, totalKarma, 0, buildType); // _hours se puede calcular desde TimeRegistry si es necesario
    }
    
    /**
     * @dev Determina el tipo de build basado en las skills validadas
     * @param skillIds Array de IDs de skills validadas
     */
    function _determineBuildType(uint256[] memory skillIds) internal view returns (string memory) {
        if (skillIds.length == 0) {
            return "Novato";
        }
        
        // Aqui puedes implementar logica mas compleja para determinar el tipo de build
        // Por ahora, usamos una logica simple basada en el numero de skills
        if (skillIds.length >= 5) {
            return "Mago del Codigo";
        } else if (skillIds.length >= 3) {
            return "Aprendiz Avanzado";
        } else if (skillIds.length >= 1) {
            return "Aprendiz";
        } else {
            return "Novato";
        }
    }
    
    /**
     * @dev Calcula el nivel de evolución basado en karma y número de skills
     * @param karma Karma total del usuario
     * @param skillCount Número de skills validadas
     */
    function _calculateEvolutionLevel(uint256 karma, uint256 skillCount) internal pure returns (uint256) {
        // Fórmula: (karma / 100) + (skillCount * 2)
        return (karma / 100) + (skillCount * 2);
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
    
    // Override functions
    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize) internal override(ERC721) whenNotPaused {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }
    
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
    
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, AccessControl, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
