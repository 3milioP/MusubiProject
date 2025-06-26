// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./IPFSRegistry.sol";

/**
 * @title SkillSystem
 * @dev Sistema de habilidades profesionales con datos almacenados en IPFS
 * Solo almacena hashes de IPFS y referencias, no datos personales
 */
contract SkillSystem is AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant KARMA_ROLE = keccak256("KARMA_ROLE");
    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");
    
    IPFSRegistry public ipfsRegistry;
    
    struct Skill {
        uint256 id;
        string skillDataHash; // Hash de IPFS con datos de la skill
        address creator;
        bool isActive;
        uint256 totalDeclarations;
        uint256 totalValidations;
        uint256 createdAt;
        uint256 updatedAt;
    }
    
    struct DeclaredSkill {
        uint256 skillId;
        address professional;
        string declarationDataHash; // Hash de IPFS con datos de la declaración
        uint256 level;
        bool isActive;
        bool isValidated;
        address validatedBy;
        uint256 validatedAt;
        uint256 declaredAt;
        uint256 updatedAt;
    }
    
    mapping(uint256 => Skill) public skills;
    mapping(address => uint256[]) public professionalSkills;
    mapping(address => mapping(uint256 => DeclaredSkill)) public declaredSkills;
    mapping(uint256 => address[]) public skillProfessionals;
    
    uint256 private _skillIdCounter;
    uint256 public totalSkills;
    uint256 public totalDeclarations;
    uint256 public totalValidations;
    
    event SkillCreated(uint256 indexed skillId, string skillDataHash, address indexed creator);
    event SkillUpdated(uint256 indexed skillId, string newSkillDataHash);
    event SkillDeactivated(uint256 indexed skillId);
    event SkillDeclared(uint256 indexed skillId, address indexed professional, string declarationDataHash, uint256 level);
    event SkillValidated(uint256 indexed skillId, address indexed professional, address indexed validator, uint256 level);
    event SkillLevelUpdated(uint256 indexed skillId, address indexed professional, uint256 newLevel);
    
    modifier onlySkillExists(uint256 skillId) {
        require(skills[skillId].creator != address(0), "Skill does not exist");
        _;
    }
    
    modifier onlyActiveSkill(uint256 skillId) {
        require(skills[skillId].isActive, "Skill is not active");
        _;
    }
    
    modifier onlySkillCreator(uint256 skillId) {
        require(skills[skillId].creator == msg.sender, "Not skill creator");
        _;
    }
    
    modifier onlyDeclaredSkill(address professional, uint256 skillId) {
        require(declaredSkills[professional][skillId].isActive, "Skill not declared by professional");
        _;
    }
    
    modifier onlyNotValidated(address professional, uint256 skillId) {
        require(!declaredSkills[professional][skillId].isValidated, "Skill already validated");
        _;
    }
    
    constructor(address _ipfsRegistry) {
        require(_ipfsRegistry != address(0), "IPFSRegistry address cannot be zero");
        
        ipfsRegistry = IPFSRegistry(_ipfsRegistry);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(KARMA_ROLE, msg.sender);
        _grantRole(VALIDATOR_ROLE, msg.sender);
    }
    
    /**
     * @dev Crea una nueva habilidad con datos en IPFS
     * @param skillDataHash Hash de IPFS con los datos de la habilidad
     */
    function createSkill(string calldata skillDataHash) external whenNotPaused nonReentrant {
        require(bytes(skillDataHash).length > 0, "Skill data hash cannot be empty");
        require(ipfsRegistry.hashExists(skillDataHash), "Skill data not found in IPFS");
        
        uint256 skillId = _skillIdCounter++;
        
        skills[skillId] = Skill({
            id: skillId,
            skillDataHash: skillDataHash,
            creator: msg.sender,
            isActive: true,
            totalDeclarations: 0,
            totalValidations: 0,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });
        
        totalSkills++;
        
        emit SkillCreated(skillId, skillDataHash, msg.sender);
    }
    
    /**
     * @dev Actualiza los datos de una habilidad (solo creador)
     * @param skillId ID de la habilidad
     * @param newSkillDataHash Nuevo hash de IPFS con datos actualizados
     */
    function updateSkill(uint256 skillId, string calldata newSkillDataHash) external whenNotPaused onlySkillExists(skillId) onlySkillCreator(skillId) onlyActiveSkill(skillId) {
        require(bytes(newSkillDataHash).length > 0, "Skill data hash cannot be empty");
        require(ipfsRegistry.hashExists(newSkillDataHash), "Skill data not found in IPFS");
        
        Skill storage skill = skills[skillId];
        skill.skillDataHash = newSkillDataHash;
        skill.updatedAt = block.timestamp;
        
        emit SkillUpdated(skillId, newSkillDataHash);
    }
    
    /**
     * @dev Desactiva una habilidad (solo creador o admin)
     * @param skillId ID de la habilidad
     */
    function deactivateSkill(uint256 skillId) external whenNotPaused onlySkillExists(skillId) {
        require(msg.sender == skills[skillId].creator || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Not authorized");
        
        Skill storage skill = skills[skillId];
        skill.isActive = false;
        skill.updatedAt = block.timestamp;
        
        emit SkillDeactivated(skillId);
    }
    
    /**
     * @dev Declara una habilidad por un profesional
     * @param skillId ID de la habilidad
     * @param declarationDataHash Hash de IPFS con datos de la declaración
     * @param level Nivel de la habilidad
     */
    function declareSkill(uint256 skillId, string calldata declarationDataHash, uint256 level) external whenNotPaused onlySkillExists(skillId) onlyActiveSkill(skillId) {
        require(bytes(declarationDataHash).length > 0, "Declaration data hash cannot be empty");
        require(ipfsRegistry.hashExists(declarationDataHash), "Declaration data not found in IPFS");
        require(level > 0 && level <= 10, "Level must be between 1 and 10");
        require(!declaredSkills[msg.sender][skillId].isActive, "Skill already declared");
        
        DeclaredSkill memory newDeclaration = DeclaredSkill({
            skillId: skillId,
            professional: msg.sender,
            declarationDataHash: declarationDataHash,
            level: level,
            isActive: true,
            isValidated: false,
            validatedBy: address(0),
            validatedAt: 0,
            declaredAt: block.timestamp,
            updatedAt: block.timestamp
        });
        
        declaredSkills[msg.sender][skillId] = newDeclaration;
        professionalSkills[msg.sender].push(skillId);
        skillProfessionals[skillId].push(msg.sender);
        
        skills[skillId].totalDeclarations++;
        totalDeclarations++;
        
        emit SkillDeclared(skillId, msg.sender, declarationDataHash, level);
    }
    
    /**
     * @dev Valida una habilidad declarada (solo validadores autorizados)
     * @param professional Dirección del profesional
     * @param skillId ID de la habilidad
     * @param level Nivel validado
     */
    function validateSkill(address professional, uint256 skillId, uint256 level) external whenNotPaused onlyRole(VALIDATOR_ROLE) onlyDeclaredSkill(professional, skillId) onlyNotValidated(professional, skillId) {
        require(professional != msg.sender, "Cannot validate own skill");
        require(level > 0 && level <= 10, "Level must be between 1 and 10");
        
        DeclaredSkill storage declaredSkill = declaredSkills[professional][skillId];
        declaredSkill.isValidated = true;
        declaredSkill.validatedBy = msg.sender;
        declaredSkill.validatedAt = block.timestamp;
        declaredSkill.level = level;
        declaredSkill.updatedAt = block.timestamp;
        
        skills[skillId].totalValidations++;
        totalValidations++;
        
        emit SkillValidated(skillId, professional, msg.sender, level);
    }
    
    /**
     * @dev Actualiza el nivel de una habilidad validada (solo validador original o admin)
     * @param professional Dirección del profesional
     * @param skillId ID de la habilidad
     * @param newLevel Nuevo nivel
     */
    function updateSkillLevel(address professional, uint256 skillId, uint256 newLevel) external whenNotPaused onlyDeclaredSkill(professional, skillId) {
        DeclaredSkill storage declaredSkill = declaredSkills[professional][skillId];
        require(declaredSkill.isValidated, "Skill not validated");
        require(msg.sender == declaredSkill.validatedBy || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Not authorized");
        require(newLevel > 0 && newLevel <= 10, "Level must be between 1 and 10");
        
        declaredSkill.level = newLevel;
        declaredSkill.updatedAt = block.timestamp;
        
        emit SkillLevelUpdated(skillId, professional, newLevel);
    }
    
    /**
     * @dev Obtiene una habilidad por ID
     * @param skillId ID de la habilidad
     */
    function getSkill(uint256 skillId) external view onlySkillExists(skillId) returns (Skill memory) {
        return skills[skillId];
    }
    
    /**
     * @dev Obtiene el hash de datos de una habilidad
     * @param skillId ID de la habilidad
     */
    function getSkillDataHash(uint256 skillId) external view onlySkillExists(skillId) returns (string memory) {
        return skills[skillId].skillDataHash;
    }
    
    /**
     * @dev Obtiene una habilidad declarada
     * @param professional Dirección del profesional
     * @param skillId ID de la habilidad
     */
    function getDeclaredSkill(address professional, uint256 skillId) external view returns (DeclaredSkill memory) {
        return declaredSkills[professional][skillId];
    }
    
    /**
     * @dev Obtiene el hash de datos de declaración de una habilidad
     * @param professional Dirección del profesional
     * @param skillId ID de la habilidad
     */
    function getDeclaredSkillDataHash(address professional, uint256 skillId) external view returns (string memory) {
        require(declaredSkills[professional][skillId].isActive, "Skill not declared");
        return declaredSkills[professional][skillId].declarationDataHash;
    }
    
    /**
     * @dev Obtiene todas las habilidades de un profesional
     * @param professional Dirección del profesional
     */
    function getProfessionalSkills(address professional) external view returns (uint256[] memory) {
        return professionalSkills[professional];
    }
    
    /**
     * @dev Obtiene todos los profesionales de una habilidad
     * @param skillId ID de la habilidad
     */
    function getSkillProfessionals(uint256 skillId) external view onlySkillExists(skillId) returns (address[] memory) {
        return skillProfessionals[skillId];
    }
    
    /**
     * @dev Verifica si un profesional tiene una habilidad declarada
     * @param professional Dirección del profesional
     * @param skillId ID de la habilidad
     */
    function hasDeclaredSkill(address professional, uint256 skillId) external view returns (bool) {
        return declaredSkills[professional][skillId].isActive;
    }
    
    /**
     * @dev Verifica si un profesional tiene una habilidad validada
     * @param professional Dirección del profesional
     * @param skillId ID de la habilidad
     */
    function hasValidatedSkill(address professional, uint256 skillId) external view returns (bool) {
        return declaredSkills[professional][skillId].isValidated;
    }
    
    /**
     * @dev Obtiene el nivel de una habilidad declarada
     * @param professional Dirección del profesional
     * @param skillId ID de la habilidad
     */
    function getSkillLevel(address professional, uint256 skillId) external view returns (uint256) {
        require(declaredSkills[professional][skillId].isActive, "Skill not declared");
        return declaredSkills[professional][skillId].level;
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
