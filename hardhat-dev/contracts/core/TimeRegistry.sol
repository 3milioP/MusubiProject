// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title TimeRegistry
 * @dev Implementa el sistema de registro horario laboral con validación bidireccional
 */
contract TimeRegistry is AccessControl, Pausable {
    using Counters for Counters.Counter;
    
    // Contadores
    Counters.Counter private _recordIdCounter;
    
    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant KARMA_ROLE = keccak256("KARMA_ROLE");
    
    // Enums
    enum RecordStatus { Pending, Validated, Disputed, Rejected }
    
    // Estructuras
    struct TimeRecord {
        uint256 id;
        address employee;
        address company;
        uint256 startTime;
        uint256 endTime;
        string description;
        uint256[] skillIds;
        RecordStatus status;
        uint256 createdAt;
        uint256 validatedAt;
    }
    
    // Mappings
    mapping(uint256 => TimeRecord) public timeRecords;
    mapping(address => uint256[]) public employeeRecords;
    mapping(address => uint256[]) public companyRecords;
    
    // Eventos
    event TimeRecordCreated(uint256 indexed recordId, address indexed employee, address indexed company);
    event TimeRecordValidated(uint256 indexed recordId, address indexed validator);
    event TimeRecordDisputed(uint256 indexed recordId, address indexed disputer);
    event TimeRecordRejected(uint256 indexed recordId, address indexed rejector);
    
    /**
     * @dev Constructor
     */
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(KARMA_ROLE, msg.sender);
    }
    
    /**
     * @dev Registra un nuevo registro horario
     * @param company Dirección de la empresa
     * @param startTime Timestamp de inicio
     * @param endTime Timestamp de fin
     * @param description Descripción de las actividades
     * @param skillIds IDs de las habilidades utilizadas
     */
    function registerTime(
        address company,
        uint256 startTime,
        uint256 endTime,
        string calldata description,
        uint256[] calldata skillIds
    ) external whenNotPaused {
        require(startTime < endTime, "Invalid time range");
        require(startTime > 0, "Invalid start time");
        
        uint256 recordId = _recordIdCounter.current();
        _recordIdCounter.increment();
        
        timeRecords[recordId] = TimeRecord({
            id: recordId,
            employee: msg.sender,
            company: company,
            startTime: startTime,
            endTime: endTime,
            description: description,
            skillIds: skillIds,
            status: RecordStatus.Pending,
            createdAt: block.timestamp,
            validatedAt: 0
        });
        
        employeeRecords[msg.sender].push(recordId);
        companyRecords[company].push(recordId);
        
        emit TimeRecordCreated(recordId, msg.sender, company);
    }
    
    /**
     * @dev Valida un registro horario (solo la empresa)
     * @param recordId ID del registro horario
     */
    function validateTimeRecord(uint256 recordId) external whenNotPaused {
        TimeRecord storage record = timeRecords[recordId];
        
        require(record.company == msg.sender, "Not authorized");
        require(record.status == RecordStatus.Pending, "Not pending");
        
        record.status = RecordStatus.Validated;
        record.validatedAt = block.timestamp;
        
        emit TimeRecordValidated(recordId, msg.sender);
    }
    
    /**
     * @dev Disputa un registro horario
     * @param recordId ID del registro horario
     */
    function disputeTimeRecord(uint256 recordId) external whenNotPaused {
        TimeRecord storage record = timeRecords[recordId];
        
        require(record.employee == msg.sender || record.company == msg.sender, "Not authorized");
        require(record.status == RecordStatus.Pending || record.status == RecordStatus.Validated, "Cannot dispute");
        
        record.status = RecordStatus.Disputed;
        
        emit TimeRecordDisputed(recordId, msg.sender);
    }
    
    /**
     * @dev Rechaza un registro horario
     * @param recordId ID del registro horario
     */
    function rejectTimeRecord(uint256 recordId) external whenNotPaused {
        TimeRecord storage record = timeRecords[recordId];
        
        require(record.company == msg.sender, "Not authorized");
        require(record.status == RecordStatus.Pending || record.status == RecordStatus.Disputed, "Cannot reject");
        
        record.status = RecordStatus.Rejected;
        
        emit TimeRecordRejected(recordId, msg.sender);
    }
    
    /**
     * @dev Resuelve una disputa (solo admin)
     * @param recordId ID del registro horario
     * @param validated Si el registro es validado o rechazado
     */
    function resolveDispute(uint256 recordId, bool validated) external onlyRole(ADMIN_ROLE) {
        TimeRecord storage record = timeRecords[recordId];
        
        require(record.status == RecordStatus.Disputed, "Not disputed");
        
        record.status = validated ? RecordStatus.Validated : RecordStatus.Rejected;
        
        if (validated) {
            record.validatedAt = block.timestamp;
            emit TimeRecordValidated(recordId, msg.sender);
        } else {
            emit TimeRecordRejected(recordId, msg.sender);
        }
    }
    
    /**
     * @dev Obtiene los registros horarios de un empleado
     * @param employee Dirección del empleado
     */
    function getEmployeeRecords(address employee) external view returns (uint256[] memory) {
        return employeeRecords[employee];
    }
    
    /**
     * @dev Obtiene los registros horarios de una empresa
     * @param company Dirección de la empresa
     */
    function getCompanyRecords(address company) external view returns (uint256[] memory) {
        return companyRecords[company];
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
