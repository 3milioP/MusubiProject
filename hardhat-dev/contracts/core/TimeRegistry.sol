// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./IPFSRegistry.sol";
import "./SkillSystem.sol";

/**
 * @title TimeRegistry
 * @dev Registro de tiempo trabajado con datos almacenados en IPFS
 * Solo almacena hashes de IPFS y referencias, no datos personales
 */
contract TimeRegistry is AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant KARMA_ROLE = keccak256("KARMA_ROLE");
    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");
    
    IPFSRegistry public ipfsRegistry;
    SkillSystem public skillSystem;
    
    struct TimeEntry {
        uint256 id;
        address professional;
        uint256 skillId;
        string timeDataHash; // Hash de IPFS con datos del registro de tiempo
        uint256 hoursWorked;
        uint256 hourlyRate;
        uint256 totalAmount;
        bool isValidated;
        address validatedBy;
        uint256 validatedAt;
        uint256 createdAt;
        uint256 updatedAt;
    }
    
    mapping(uint256 => TimeEntry) public timeEntries;
    mapping(address => uint256[]) public professionalEntries;
    mapping(uint256 => uint256[]) public skillEntries;
    
    uint256 private _entryIdCounter;
    uint256 public totalEntries;
    uint256 public totalValidatedEntries;
    uint256 public totalHoursWorked;
    
    event TimeEntryCreated(uint256 indexed entryId, address indexed professional, uint256 skillId, string timeDataHash, uint256 hoursWorked);
    event TimeEntryUpdated(uint256 indexed entryId, string newTimeDataHash);
    event TimeEntryValidated(uint256 indexed entryId, address indexed validator, uint256 totalAmount);
    event TimeEntryDeleted(uint256 indexed entryId);
    
    modifier onlyEntryExists(uint256 entryId) {
        require(timeEntries[entryId].professional != address(0), "Time entry does not exist");
        _;
    }
    
    modifier onlyEntryOwner(uint256 entryId) {
        require(timeEntries[entryId].professional == msg.sender, "Not entry owner");
        _;
    }
    
    modifier onlyNotValidated(uint256 entryId) {
        require(!timeEntries[entryId].isValidated, "Entry already validated");
        _;
    }
    
    modifier onlyValidated(uint256 entryId) {
        require(timeEntries[entryId].isValidated, "Entry not validated");
        _;
    }
    
    constructor(address _ipfsRegistry, address _skillSystem) {
        require(_ipfsRegistry != address(0), "IPFSRegistry address cannot be zero");
        
        ipfsRegistry = IPFSRegistry(_ipfsRegistry);
        skillSystem = SkillSystem(_skillSystem);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(KARMA_ROLE, msg.sender);
        _grantRole(VALIDATOR_ROLE, msg.sender);
    }
    
    /**
     * @dev Registra tiempo trabajado con datos en IPFS
     * @param skillId ID de la habilidad utilizada
     * @param timeDataHash Hash de IPFS con datos del registro de tiempo
     * @param hoursWorked Horas trabajadas
     * @param hourlyRate Tarifa por hora
     */
    function registerTime(uint256 skillId, string calldata timeDataHash, uint256 hoursWorked, uint256 hourlyRate) external whenNotPaused nonReentrant {
        require(bytes(timeDataHash).length > 0, "Time data hash cannot be empty");
        require(ipfsRegistry.hashExists(timeDataHash), "Time data not found in IPFS");
        require(hoursWorked > 0, "Hours worked must be greater than zero");
        require(hourlyRate > 0, "Hourly rate must be greater than zero");
        
        // Verificar que el profesional tiene la habilidad declarada y validada
        if (address(skillSystem) != address(0)) {
            require(skillSystem.hasDeclaredSkill(msg.sender, skillId), "Skill not declared by professional");
            require(skillSystem.hasValidatedSkill(msg.sender, skillId), "Skill not validated");
        }
        
        uint256 entryId = _entryIdCounter++;
        uint256 totalAmount = hoursWorked * hourlyRate;
        
        timeEntries[entryId] = TimeEntry({
            id: entryId,
            professional: msg.sender,
            skillId: skillId,
            timeDataHash: timeDataHash,
            hoursWorked: hoursWorked,
            hourlyRate: hourlyRate,
            totalAmount: totalAmount,
            isValidated: false,
            validatedBy: address(0),
            validatedAt: 0,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });
        
        professionalEntries[msg.sender].push(entryId);
        skillEntries[skillId].push(entryId);
        
        totalEntries++;
        totalHoursWorked += hoursWorked;
        
        emit TimeEntryCreated(entryId, msg.sender, skillId, timeDataHash, hoursWorked);
    }
    
    /**
     * @dev Actualiza los datos de un registro de tiempo (solo propietario)
     * @param entryId ID del registro
     * @param newTimeDataHash Nuevo hash de IPFS con datos actualizados
     * @param newHoursWorked Nuevas horas trabajadas
     * @param newHourlyRate Nueva tarifa por hora
     */
    function updateTimeEntry(uint256 entryId, string calldata newTimeDataHash, uint256 newHoursWorked, uint256 newHourlyRate) external whenNotPaused onlyEntryExists(entryId) onlyEntryOwner(entryId) onlyNotValidated(entryId) {
        require(bytes(newTimeDataHash).length > 0, "Time data hash cannot be empty");
        require(ipfsRegistry.hashExists(newTimeDataHash), "Time data not found in IPFS");
        require(newHoursWorked > 0, "Hours worked must be greater than zero");
        require(newHourlyRate > 0, "Hourly rate must be greater than zero");
        
        TimeEntry storage entry = timeEntries[entryId];
        
        // Actualizar total de horas trabajadas
        totalHoursWorked = totalHoursWorked - entry.hoursWorked + newHoursWorked;
        
        entry.timeDataHash = newTimeDataHash;
        entry.hoursWorked = newHoursWorked;
        entry.hourlyRate = newHourlyRate;
        entry.totalAmount = newHoursWorked * newHourlyRate;
        entry.updatedAt = block.timestamp;
        
        emit TimeEntryUpdated(entryId, newTimeDataHash);
    }
    
    /**
     * @dev Valida un registro de tiempo (solo validadores autorizados)
     * @param entryId ID del registro
     */
    function validateTimeEntry(uint256 entryId) external whenNotPaused onlyRole(VALIDATOR_ROLE) onlyEntryExists(entryId) onlyNotValidated(entryId) {
        TimeEntry storage entry = timeEntries[entryId];
        require(entry.professional != msg.sender, "Cannot validate own time entry");
        
        entry.isValidated = true;
        entry.validatedBy = msg.sender;
        entry.validatedAt = block.timestamp;
        entry.updatedAt = block.timestamp;
        
        totalValidatedEntries++;
        
        emit TimeEntryValidated(entryId, msg.sender, entry.totalAmount);
    }
    
    /**
     * @dev Elimina un registro de tiempo (solo propietario si no está validado, o admin)
     * @param entryId ID del registro
     */
    function deleteTimeEntry(uint256 entryId) external whenNotPaused onlyEntryExists(entryId) {
        TimeEntry storage entry = timeEntries[entryId];
        require(msg.sender == entry.professional || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Not authorized");
        require(!entry.isValidated || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Cannot delete validated entry");
        
        // Actualizar contadores
        totalHoursWorked -= entry.hoursWorked;
        if (entry.isValidated) {
            totalValidatedEntries--;
        }
        totalEntries--;
        
        // Remover de arrays
        _removeFromArray(professionalEntries[entry.professional], entryId);
        _removeFromArray(skillEntries[entry.skillId], entryId);
        
        // Eliminar entrada
        delete timeEntries[entryId];
        
        emit TimeEntryDeleted(entryId);
    }
    
    /**
     * @dev Obtiene un registro de tiempo por ID
     * @param entryId ID del registro
     */
    function getTimeEntry(uint256 entryId) external view onlyEntryExists(entryId) returns (TimeEntry memory) {
        return timeEntries[entryId];
    }
    
    /**
     * @dev Obtiene el hash de datos de un registro de tiempo
     * @param entryId ID del registro
     */
    function getTimeEntryDataHash(uint256 entryId) external view onlyEntryExists(entryId) returns (string memory) {
        return timeEntries[entryId].timeDataHash;
    }
    
    /**
     * @dev Obtiene todos los registros de tiempo de un profesional
     * @param professional Dirección del profesional
     */
    function getProfessionalEntries(address professional) external view returns (uint256[] memory) {
        return professionalEntries[professional];
    }
    
    /**
     * @dev Obtiene todos los registros de tiempo de una habilidad
     * @param skillId ID de la habilidad
     */
    function getSkillEntries(uint256 skillId) external view returns (uint256[] memory) {
        return skillEntries[skillId];
    }
    
    /**
     * @dev Obtiene el total de horas trabajadas por un profesional
     * @param professional Dirección del profesional
     */
    function getProfessionalTotalHours(address professional) external view returns (uint256) {
        uint256[] memory entries = professionalEntries[professional];
        uint256 totalHours = 0;
        
        for (uint256 i = 0; i < entries.length; i++) {
            if (timeEntries[entries[i]].professional != address(0)) {
                totalHours += timeEntries[entries[i]].hoursWorked;
            }
        }
        
        return totalHours;
    }
    
    /**
     * @dev Obtiene el total de horas trabajadas en una habilidad
     * @param skillId ID de la habilidad
     */
    function getSkillTotalHours(uint256 skillId) external view returns (uint256) {
        uint256[] memory entries = skillEntries[skillId];
        uint256 totalHours = 0;
        
        for (uint256 i = 0; i < entries.length; i++) {
            if (timeEntries[entries[i]].professional != address(0)) {
                totalHours += timeEntries[entries[i]].hoursWorked;
            }
        }
        
        return totalHours;
    }
    
    /**
     * @dev Verifica si un registro de tiempo está validado
     * @param entryId ID del registro
     */
    function isTimeEntryValidated(uint256 entryId) external view returns (bool) {
        require(timeEntries[entryId].professional != address(0), "Time entry does not exist");
        return timeEntries[entryId].isValidated;
    }
    
    /**
     * @dev Obtiene el total de registros de tiempo
     */
    function getTotalEntries() external view returns (uint256) {
        return totalEntries;
    }
    
    /**
     * @dev Obtiene el total de registros validados
     */
    function getTotalValidatedEntries() external view returns (uint256) {
        return totalValidatedEntries;
    }
    
    /**
     * @dev Obtiene el total de horas trabajadas
     */
    function getTotalHoursWorked() external view returns (uint256) {
        return totalHoursWorked;
    }
    
    /**
     * @dev Función auxiliar para remover un elemento de un array
     * @param array Array del que remover el elemento
     * @param element Elemento a remover
     */
    function _removeFromArray(uint256[] storage array, uint256 element) internal {
        for (uint256 i = 0; i < array.length; i++) {
            if (array[i] == element) {
                array[i] = array[array.length - 1];
                array.pop();
                break;
            }
        }
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
