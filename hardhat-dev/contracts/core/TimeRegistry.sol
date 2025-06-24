// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./ProfileRegistry.sol";
import "./SkillSystem.sol";

/**
 * @title TimeRegistry
 * @dev Sistema de registro de tiempo con validación de habilidades y perfiles
 */
contract TimeRegistry is AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant KARMA_ROLE = keccak256("KARMA_ROLE");
    
    ProfileRegistry public profileRegistry;
    SkillSystem public skillSystem;
    
    struct TimeRecord {
        uint256 id;
        address professional;
        address company;
        uint256 skillId;
        uint256 startTime;
        uint256 endTime;
        uint256 totalHours;
        string description;
        RecordStatus status;
        address validatedBy;
        uint256 validatedAt;
        uint256 disputedAt;
        address disputedBy;
        uint256 createdAt;
        uint256 updatedAt;
    }
    
    enum RecordStatus { Pending, Validated, Disputed }
    
    mapping(uint256 => TimeRecord) public timeRecords;
    mapping(address => uint256[]) public professionalRecords; // professional => recordIds[]
    mapping(address => uint256[]) public companyRecords; // company => recordIds[]
    mapping(uint256 => uint256[]) public skillRecords; // skillId => recordIds[]
    
    uint256 private _recordIdCounter;
    
    event TimeRecorded(uint256 indexed recordId, address indexed professional, address indexed company, uint256 skillId);
    event TimeValidated(uint256 indexed recordId, address indexed validator);
    event TimeDisputed(uint256 indexed recordId, address indexed disputer);
    event KarmaUpdated(address indexed professional, uint256 newKarma);
    
    modifier onlyRegisteredProfessional(address professional) {
        require(profileRegistry.hasRegisteredProfile(professional), "Professional profile not registered");
        require(profileRegistry.getProfile(professional).profileType == ProfileRegistry.ProfileType.Professional, "Only professionals can record time");
        _;
    }
    
    modifier onlyRegisteredCompany(address company) {
        require(profileRegistry.hasRegisteredProfile(company), "Company profile not registered");
        require(profileRegistry.getProfile(company).profileType == ProfileRegistry.ProfileType.Company, "Only companies can validate time");
        _;
    }
    
    modifier onlyRecordOwner(uint256 recordId) {
        require(timeRecords[recordId].professional == msg.sender, "Not record owner");
        _;
    }
    
    modifier onlyRecordCompany(uint256 recordId) {
        require(timeRecords[recordId].company == msg.sender, "Not record company");
        _;
    }
    
    modifier recordExists(uint256 recordId) {
        require(timeRecords[recordId].professional != address(0), "Record does not exist");
        _;
    }
    
    modifier skillExists(uint256 skillId) {
        // Verificar que la habilidad existe en SkillSystem
        try skillSystem.getSkillCount() returns (uint256 skillCount) {
            require(skillId < skillCount, "Skill does not exist");
        } catch {
            revert("Skill system not available");
        }
        _;
    }
    
    constructor(address _profileRegistry, address _skillSystem) {
        require(_profileRegistry != address(0), "ProfileRegistry address cannot be zero");
        require(_skillSystem != address(0), "SkillSystem address cannot be zero");
        
        profileRegistry = ProfileRegistry(_profileRegistry);
        skillSystem = SkillSystem(_skillSystem);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(KARMA_ROLE, msg.sender);
    }
    
    /**
     * @dev Registra tiempo trabajado (solo profesionales verificados)
     * @param company Dirección de la empresa
     * @param skillId ID de la habilidad utilizada
     * @param startTime Timestamp de inicio
     * @param endTime Timestamp de fin
     * @param description Descripción del trabajo realizado
     */
    function recordTime(
        address company,
        uint256 skillId,
        uint256 startTime,
        uint256 endTime,
        string calldata description
    ) external whenNotPaused onlyRegisteredProfessional(msg.sender) skillExists(skillId) {
        require(company != address(0), "Company address cannot be zero");
        require(company != msg.sender, "Cannot record time for self");
        require(startTime > 0, "Start time cannot be zero");
        require(endTime > startTime, "End time must be after start time");
        require(endTime <= block.timestamp, "End time cannot be in the future");
        require(bytes(description).length > 0, "Description cannot be empty");
        
        // Verificar que el profesional tiene la habilidad declarada
        try skillSystem.getDeclaredSkill(msg.sender, skillId) returns (SkillSystem.DeclaredSkill memory declaredSkill) {
            require(declaredSkill.isActive, "Skill not declared by professional");
            require(declaredSkill.isValidated, "Skill not validated");
        } catch {
            revert("Skill verification failed");
        }
        
        uint256 totalHours = (endTime - startTime) / 3600; // Convertir a horas
        require(totalHours > 0, "Time period too short");
        
        uint256 recordId = _recordIdCounter++;
        
        timeRecords[recordId] = TimeRecord({
            id: recordId,
            professional: msg.sender,
            company: company,
            skillId: skillId,
            startTime: startTime,
            endTime: endTime,
            totalHours: totalHours,
            description: description,
            status: RecordStatus.Pending,
            validatedBy: address(0),
            validatedAt: 0,
            disputedAt: 0,
            disputedBy: address(0),
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });
        
        professionalRecords[msg.sender].push(recordId);
        companyRecords[company].push(recordId);
        skillRecords[skillId].push(recordId);
        
        emit TimeRecorded(recordId, msg.sender, company, skillId);
    }
    
    /**
     * @dev Valida un registro de tiempo (solo empresas verificadas)
     * @param recordId ID del registro
     */
    function validateTimeRecord(uint256 recordId) external whenNotPaused recordExists(recordId) onlyRecordCompany(recordId) onlyRegisteredCompany(msg.sender) {
        TimeRecord storage record = timeRecords[recordId];
        require(record.status == RecordStatus.Pending, "Record not in pending status");
        
        record.status = RecordStatus.Validated;
        record.validatedBy = msg.sender;
        record.validatedAt = block.timestamp;
        record.updatedAt = block.timestamp;
        
        // Incrementar karma del profesional basado en las horas trabajadas
        uint256 currentKarma = profileRegistry.getProfile(record.professional).karma;
        uint256 newKarma = currentKarma + (record.totalHours * 5); // +5 karma por hora
        profileRegistry.updateKarma(record.professional, newKarma);
        
        emit TimeValidated(recordId, msg.sender);
        emit KarmaUpdated(record.professional, newKarma);
    }
    
    /**
     * @dev Disputa un registro de tiempo
     * @param recordId ID del registro
     */
    function disputeTimeRecord(uint256 recordId) external whenNotPaused recordExists(recordId) {
        TimeRecord storage record = timeRecords[recordId];
        require(record.status == RecordStatus.Pending || record.status == RecordStatus.Validated, "Cannot dispute this record");
        require(msg.sender == record.professional || msg.sender == record.company, "Not authorized to dispute");
        
        record.status = RecordStatus.Disputed;
        record.disputedBy = msg.sender;
        record.disputedAt = block.timestamp;
        record.updatedAt = block.timestamp;
        
        emit TimeDisputed(recordId, msg.sender);
    }
    
    /**
     * @dev Obtiene los registros de tiempo de un profesional
     * @param professional Dirección del profesional
     */
    function getProfessionalRecords(address professional) public view returns (uint256[] memory) {
        return professionalRecords[professional];
    }
    
    /**
     * @dev Obtiene los registros de tiempo de una empresa
     * @param company Dirección de la empresa
     */
    function getCompanyRecords(address company) external view returns (uint256[] memory) {
        return companyRecords[company];
    }
    
    /**
     * @dev Obtiene los registros de tiempo para una habilidad específica
     * @param skillId ID de la habilidad
     */
    function getSkillRecords(uint256 skillId) external view returns (uint256[] memory) {
        return skillRecords[skillId];
    }
    
    /**
     * @dev Obtiene información detallada de un registro
     * @param recordId ID del registro
     */
    function getTimeRecord(uint256 recordId) external view returns (TimeRecord memory) {
        return timeRecords[recordId];
    }
    
    /**
     * @dev Obtiene información de múltiples registros
     * @param recordIds Array de IDs de registros
     */
    function getMultipleTimeRecords(uint256[] calldata recordIds) external view returns (TimeRecord[] memory) {
        TimeRecord[] memory result = new TimeRecord[](recordIds.length);
        
        for (uint256 i = 0; i < recordIds.length; i++) {
            result[i] = timeRecords[recordIds[i]];
        }
        
        return result;
    }
    
    /**
     * @dev Obtiene el número total de registros
     */
    function getRecordCount() external view returns (uint256) {
        return _recordIdCounter;
    }
    
    /**
     * @dev Obtiene el número de registros de un profesional
     * @param professional Dirección del profesional
     */
    function getProfessionalRecordCount(address professional) external view returns (uint256) {
        return professionalRecords[professional].length;
    }
    
    /**
     * @dev Obtiene el número de registros de una empresa
     * @param company Dirección de la empresa
     */
    function getCompanyRecordCount(address company) external view returns (uint256) {
        return companyRecords[company].length;
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
    
    /**
     * @dev Devuelve el número total de registros de tiempo creados
     */
    function totalTimeRecords() external view returns (uint256) {
        return _recordIdCounter;
    }
    
    /**
     * @dev Devuelve los IDs de registros de tiempo donde el usuario es profesional o empresa
     * @param user Dirección del usuario
     */
    function getUserTimeRecords(address user) external view returns (uint256[] memory) {
        uint256 profCount = professionalRecords[user].length;
        uint256 compCount = companyRecords[user].length;
        uint256 total = profCount + compCount;
        uint256[] memory allRecords = new uint256[](total);
        for (uint256 i = 0; i < profCount; i++) {
            allRecords[i] = professionalRecords[user][i];
        }
        for (uint256 j = 0; j < compCount; j++) {
            allRecords[profCount + j] = companyRecords[user][j];
        }
        return allRecords;
    }
}
