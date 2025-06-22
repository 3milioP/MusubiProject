// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./ProfileRegistry.sol";

/**
 * @title SkillSystem
 * @dev Sistema de gestión de habilidades con validación y sincronización de karma
 */
contract SkillSystem is AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant KARMA_ROLE = keccak256("KARMA_ROLE");
    
    ProfileRegistry public profileRegistry;
    
    struct Skill {
        uint256 id;
        string name;
        string category;
        bool isActive;
        uint256 createdAt;
    }
    
    struct DeclaredSkill {
        uint256 skillId;
        address professional;
        uint8 level; // 1-5
        bool isActive;
        bool isValidated;
        address validatedBy;
        uint256 validationDate;
        uint256 declaredAt;
        uint256 updatedAt;
    }
    
    struct ValidationRequest {
        uint256 skillId;
        address professional;
        address validator;
        uint256 requestedAt;
        bool isPending;
    }
    
    mapping(uint256 => Skill) public skills;
    mapping(address => mapping(uint256 => DeclaredSkill)) public declaredSkills; // professional => skillId => DeclaredSkill
    mapping(address => uint256[]) public professionalSkills; // professional => skillIds[]
    mapping(uint256 => address[]) public skillProfessionals; // skillId => professionals[]
    mapping(uint256 => ValidationRequest[]) public validationRequests; // skillId => requests[]
    
    uint256 private _skillIdCounter;
    uint256 private _validationRequestIdCounter;
    
    event SkillCreated(uint256 indexed skillId, string name, string category);
    event SkillDeclared(uint256 indexed skillId, address indexed professional, uint8 level);
    event SkillUpdated(uint256 indexed skillId, address indexed professional, uint8 newLevel);
    event ValidationRequested(uint256 indexed skillId, address indexed professional, address indexed validator);
    event SkillValidated(uint256 indexed skillId, address indexed professional, address indexed validator);
    event KarmaUpdated(address indexed professional, uint256 newKarma);
    
    modifier onlyRegisteredProfessional(address professional) {
        require(profileRegistry.hasRegisteredProfile(professional), "Professional profile not registered");
        require(profileRegistry.getProfile(professional).profileType == ProfileRegistry.ProfileType.Professional, "Only professionals can declare skills");
        _;
    }
    
    modifier onlyRegisteredValidator(address validator) {
        require(profileRegistry.hasRegisteredProfile(validator), "Validator profile not registered");
        require(hasRole(KARMA_ROLE, validator), "Validator must have KARMA_ROLE");
        _;
    }
    
    modifier skillExists(uint256 skillId) {
        require(skills[skillId].isActive, "Skill does not exist or is inactive");
        _;
    }
    
    modifier skillDeclared(address professional, uint256 skillId) {
        require(declaredSkills[professional][skillId].isActive, "Skill not declared by professional");
        _;
    }
    
    constructor(address _profileRegistry) {
        require(_profileRegistry != address(0), "ProfileRegistry address cannot be zero");
        profileRegistry = ProfileRegistry(_profileRegistry);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(KARMA_ROLE, msg.sender);
    }
    
    /**
     * @dev Crea una nueva habilidad (solo admin)
     * @param name Nombre de la habilidad
     * @param category Categoría de la habilidad
     */
    function createSkill(string calldata name, string calldata category) external onlyRole(DEFAULT_ADMIN_ROLE) whenNotPaused {
        require(bytes(name).length > 0, "Skill name cannot be empty");
        require(bytes(category).length > 0, "Skill category cannot be empty");
        
        uint256 skillId = _skillIdCounter++;
        
        skills[skillId] = Skill({
            id: skillId,
            name: name,
            category: category,
            isActive: true,
            createdAt: block.timestamp
        });
        
        emit SkillCreated(skillId, name, category);
    }
    
    /**
     * @dev Declara una habilidad (solo profesionales verificados)
     * @param skillId ID de la habilidad
     * @param level Nivel de la habilidad (1-5)
     */
    function declareSkill(uint256 skillId, uint8 level) external whenNotPaused skillExists(skillId) onlyRegisteredProfessional(msg.sender) {
        require(level >= 1 && level <= 5, "Level must be between 1 and 5");
        require(declaredSkills[msg.sender][skillId].skillId == 0, "Skill already declared");
        
        declaredSkills[msg.sender][skillId] = DeclaredSkill({
            skillId: skillId,
            professional: msg.sender,
            level: level,
            isActive: true,
            isValidated: false,
            validatedBy: address(0),
            validationDate: 0,
            declaredAt: block.timestamp,
            updatedAt: block.timestamp
        });
        
        professionalSkills[msg.sender].push(skillId);
        skillProfessionals[skillId].push(msg.sender);
        
        emit SkillDeclared(skillId, msg.sender, level);
    }
    
    /**
     * @dev Actualiza el nivel de una habilidad declarada
     * @param skillId ID de la habilidad
     * @param newLevel Nuevo nivel (1-5)
     */
    function updateSkillLevel(uint256 skillId, uint8 newLevel) external whenNotPaused skillDeclared(msg.sender, skillId) {
        require(newLevel >= 1 && newLevel <= 5, "Level must be between 1 and 5");
        
        DeclaredSkill storage declaredSkill = declaredSkills[msg.sender][skillId];
        declaredSkill.level = newLevel;
        declaredSkill.updatedAt = block.timestamp;
        
        // Reset validation when level changes
        declaredSkill.isValidated = false;
        declaredSkill.validatedBy = address(0);
        declaredSkill.validationDate = 0;
        
        emit SkillUpdated(skillId, msg.sender, newLevel);
    }
    
    /**
     * @dev Solicita validación de una habilidad
     * @param skillId ID de la habilidad
     * @param validator Dirección del validador
     */
    function requestValidation(uint256 skillId, address validator) external whenNotPaused skillDeclared(msg.sender, skillId) onlyRegisteredValidator(validator) {
        require(!declaredSkills[msg.sender][skillId].isValidated, "Skill already validated");
        
        uint256 requestId = _validationRequestIdCounter++;
        
        validationRequests[skillId].push(ValidationRequest({
            skillId: skillId,
            professional: msg.sender,
            validator: validator,
            requestedAt: block.timestamp,
            isPending: true
        }));
        
        emit ValidationRequested(skillId, msg.sender, validator);
    }
    
    /**
     * @dev Valida una habilidad (solo validadores verificados)
     * @param professional Dirección del profesional
     * @param skillId ID de la habilidad
     * @param isValid Indica si la validación es positiva
     */
    function validateSkill(address professional, uint256 skillId, bool isValid) external whenNotPaused skillDeclared(professional, skillId) onlyRegisteredValidator(msg.sender) {
        require(!declaredSkills[professional][skillId].isValidated, "Skill already validated");
        require(professional != msg.sender, "Cannot validate own skills");
        
        DeclaredSkill storage declaredSkill = declaredSkills[professional][skillId];
        
        if (isValid) {
            declaredSkill.isValidated = true;
            declaredSkill.validatedBy = msg.sender;
            declaredSkill.validationDate = block.timestamp;
            
            // Incrementar karma del profesional
            uint256 currentKarma = profileRegistry.getProfile(professional).karma;
            uint256 newKarma = currentKarma + (declaredSkill.level * 10); // +10 por nivel
            profileRegistry.updateKarma(professional, newKarma);
            
            emit SkillValidated(skillId, professional, msg.sender);
            emit KarmaUpdated(professional, newKarma);
        }
    }
    
    /**
     * @dev Obtiene las habilidades declaradas por un profesional
     * @param professional Dirección del profesional
     */
    function getProfessionalSkills(address professional) external view returns (uint256[] memory) {
        return professionalSkills[professional];
    }
    
    /**
     * @dev Obtiene los profesionales que declaran una habilidad
     * @param skillId ID de la habilidad
     */
    function getSkillProfessionals(uint256 skillId) external view returns (address[] memory) {
        return skillProfessionals[skillId];
    }
    
    /**
     * @dev Obtiene información detallada de una habilidad declarada
     * @param professional Dirección del profesional
     * @param skillId ID de la habilidad
     */
    function getDeclaredSkill(address professional, uint256 skillId) external view returns (DeclaredSkill memory) {
        return declaredSkills[professional][skillId];
    }
    
    /**
     * @dev Obtiene información de múltiples habilidades declaradas
     * @param professional Dirección del profesional
     * @param skillIds Array de IDs de habilidades
     */
    function getMultipleDeclaredSkills(address professional, uint256[] calldata skillIds) external view returns (DeclaredSkill[] memory) {
        DeclaredSkill[] memory result = new DeclaredSkill[](skillIds.length);
        
        for (uint256 i = 0; i < skillIds.length; i++) {
            result[i] = declaredSkills[professional][skillIds[i]];
        }
        
        return result;
    }
    
    /**
     * @dev Obtiene el número total de habilidades
     */
    function getSkillCount() external view returns (uint256) {
        return _skillIdCounter;
    }
    
    /**
     * @dev Obtiene el número de habilidades declaradas por un profesional
     * @param professional Dirección del profesional
     */
    function getProfessionalSkillCount(address professional) external view returns (uint256) {
        return professionalSkills[professional].length;
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
