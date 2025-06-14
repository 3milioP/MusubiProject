// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title SkillSystem
 * @dev Implementa el sistema de declaración y validación de habilidades profesionales
 */
contract SkillSystem is AccessControl, Pausable {
    using Counters for Counters.Counter;
    
    // Contadores
    Counters.Counter private _skillIdCounter;
    Counters.Counter private _validationIdCounter;
    
    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant KARMA_ROLE = keccak256("KARMA_ROLE");
    
    // Enums
    enum SkillLevel { Beginner, Intermediate, Advanced, Expert }
    enum ValidationStatus { Pending, Accepted, Disputed, Rejected }
    
    // Estructuras
    struct Skill {
        uint256 id;
        string name;
        string category;
        bool isActive;
    }
    
    struct DeclaredSkill {
        uint256 id;
        uint256 skillId;
        address professional;
        SkillLevel declaredLevel;
        uint256 karma;
        uint256 declaredAt;
    }
    
    struct Validation {
        uint256 id;
        uint256 declaredSkillId;
        address validator;
        SkillLevel validatedLevel;
        string context;
        ValidationStatus status;
        uint256 createdAt;
        uint256 respondedAt;
    }
    
    // Mappings
    mapping(uint256 => Skill) public skills;
    mapping(uint256 => DeclaredSkill) public declaredSkills;
    mapping(address => uint256[]) public professionalSkills;
    mapping(uint256 => Validation[]) public skillValidations;
    mapping(uint256 => uint256) public skillKarma;
    
    // Eventos
    event SkillCreated(uint256 indexed skillId, string name, string category);
    event SkillDeclared(uint256 indexed declaredSkillId, address indexed professional, uint256 skillId, SkillLevel level);
    event ValidationRequested(uint256 indexed validationId, uint256 indexed declaredSkillId, address indexed validator);
    event ValidationResponded(uint256 indexed validationId, ValidationStatus status);
    event KarmaUpdated(address indexed professional, uint256 indexed skillId, uint256 karma);
    
    /**
     * @dev Constructor
     */
    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(KARMA_ROLE, msg.sender);
    }
    
    /**
     * @dev Crea una nueva habilidad en el sistema
     * @param name Nombre de la habilidad
     * @param category Categoría de la habilidad
     */
    function createSkill(string calldata name, string calldata category) external onlyRole(ADMIN_ROLE) {
        uint256 skillId = _skillIdCounter.current();
        _skillIdCounter.increment();
        
        skills[skillId] = Skill({
            id: skillId,
            name: name,
            category: category,
            isActive: true
        });
        
        emit SkillCreated(skillId, name, category);
    }
    
    /**
     * @dev Declara una habilidad para un profesional
     * @param skillId ID de la habilidad
     * @param level Nivel declarado
     */
    function declareSkill(uint256 skillId, SkillLevel level) external whenNotPaused {
        require(skills[skillId].isActive, "Skill not active");
        
        uint256 declaredSkillId = _validationIdCounter.current();
        _validationIdCounter.increment();
        
        declaredSkills[declaredSkillId] = DeclaredSkill({
            id: declaredSkillId,
            skillId: skillId,
            professional: msg.sender,
            declaredLevel: level,
            karma: 0,
            declaredAt: block.timestamp
        });
        
        professionalSkills[msg.sender].push(declaredSkillId);
        
        emit SkillDeclared(declaredSkillId, msg.sender, skillId, level);
    }
    
    /**
     * @dev Solicita validación de una habilidad a un validador
     * @param declaredSkillId ID de la habilidad declarada
     * @param validator Dirección del validador
     * @param context Contexto de la validación
     */
    function requestValidation(uint256 declaredSkillId, address validator, string calldata context) external whenNotPaused {
        require(declaredSkills[declaredSkillId].professional == msg.sender, "Not skill owner");
        
        uint256 validationId = skillValidations[declaredSkillId].length;
        
        skillValidations[declaredSkillId].push(Validation({
            id: validationId,
            declaredSkillId: declaredSkillId,
            validator: validator,
            validatedLevel: SkillLevel.Beginner,
            context: context,
            status: ValidationStatus.Pending,
            createdAt: block.timestamp,
            respondedAt: 0
        }));
        
        emit ValidationRequested(validationId, declaredSkillId, validator);
    }
    
    /**
     * @dev Valida una habilidad (responde a una solicitud de validación)
     * @param declaredSkillId ID de la habilidad declarada
     * @param validationId ID de la validación
     * @param level Nivel validado
     */
    function validateSkill(uint256 declaredSkillId, uint256 validationId, SkillLevel level) external whenNotPaused {
        Validation storage validation = skillValidations[declaredSkillId][validationId];
        
        require(validation.validator == msg.sender, "Not validator");
        require(validation.status == ValidationStatus.Pending, "Not pending");
        
        validation.validatedLevel = level;
        validation.status = ValidationStatus.Accepted;
        validation.respondedAt = block.timestamp;
        
        // Actualizar karma
        _updateKarma(declaredSkillId);
        
        emit ValidationResponded(validationId, ValidationStatus.Accepted);
    }
    
    /**
     * @dev Disputa una validación
     * @param declaredSkillId ID de la habilidad declarada
     * @param validationId ID de la validación
     */
    function disputeValidation(uint256 declaredSkillId, uint256 validationId) external whenNotPaused {
        Validation storage validation = skillValidations[declaredSkillId][validationId];
        DeclaredSkill storage declaredSkill = declaredSkills[declaredSkillId];
        
        require(declaredSkill.professional == msg.sender || validation.validator == msg.sender, "Not authorized");
        require(validation.status == ValidationStatus.Pending || validation.status == ValidationStatus.Accepted, "Cannot dispute");
        
        validation.status = ValidationStatus.Disputed;
        validation.respondedAt = block.timestamp;
        
        emit ValidationResponded(validationId, ValidationStatus.Disputed);
    }
    
    /**
     * @dev Resuelve una disputa (solo admin)
     * @param declaredSkillId ID de la habilidad declarada
     * @param validationId ID de la validación
     * @param accepted Si la validación es aceptada o rechazada
     */
    function resolveDispute(uint256 declaredSkillId, uint256 validationId, bool accepted) external onlyRole(ADMIN_ROLE) {
        Validation storage validation = skillValidations[declaredSkillId][validationId];
        
        require(validation.status == ValidationStatus.Disputed, "Not disputed");
        
        validation.status = accepted ? ValidationStatus.Accepted : ValidationStatus.Rejected;
        validation.respondedAt = block.timestamp;
        
        if (accepted) {
            // Actualizar karma
            _updateKarma(declaredSkillId);
        }
        
        emit ValidationResponded(validationId, validation.status);
    }
    
    /**
     * @dev Actualiza el karma de una habilidad declarada
     * @param declaredSkillId ID de la habilidad declarada
     */
    function _updateKarma(uint256 declaredSkillId) internal {
        DeclaredSkill storage declaredSkill = declaredSkills[declaredSkillId];
        uint256 totalKarma = 0;
        uint256 validationCount = 0;
        
        for (uint256 i = 0; i < skillValidations[declaredSkillId].length; i++) {
            Validation storage validation = skillValidations[declaredSkillId][i];
            if (validation.status == ValidationStatus.Accepted) {
                // Fórmula simple: 10 puntos base + nivel validado * 5
                uint256 validationKarma = 10 + uint256(validation.validatedLevel) * 5;
                totalKarma += validationKarma;
                validationCount++;
            }
        }
        
        if (validationCount > 0) {
            declaredSkill.karma = totalKarma;
            skillKarma[declaredSkillId] = totalKarma;
            
            emit KarmaUpdated(declaredSkill.professional, declaredSkill.skillId, totalKarma);
        }
    }
    
    /**
     * @dev Obtiene el karma total de un profesional para una habilidad específica
     * @param professional Dirección del profesional
     * @param skillId ID de la habilidad
     */
    function getSkillKarma(address professional, uint256 skillId) external view returns (uint256) {
        uint256 totalKarma = 0;
        
        for (uint256 i = 0; i < professionalSkills[professional].length; i++) {
            uint256 declaredSkillId = professionalSkills[professional][i];
            DeclaredSkill storage declaredSkill = declaredSkills[declaredSkillId];
            
            if (declaredSkill.skillId == skillId) {
                totalKarma += declaredSkill.karma;
            }
        }
        
        return totalKarma;
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
