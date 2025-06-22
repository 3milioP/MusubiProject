// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title IPFSRegistry
 * @dev Contrato para almacenar y gestionar hashes de IPFS de manera descentralizada
 * Los datos se almacenan en IPFS y solo los hashes se guardan en blockchain
 */
contract IPFSRegistry is AccessControl, Pausable {
    using Counters for Counters.Counter;

    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant WRITER_ROLE = keccak256("WRITER_ROLE");
    bytes32 public constant READER_ROLE = keccak256("READER_ROLE");

    // Estructura para almacenar información de IPFS
    struct IPFSRecord {
        string ipfsHash;
        string sha256Hash;
        string collection;
        string dataType;
        address owner;
        uint256 timestamp;
        bool active;
    }

    // Mappings
    mapping(uint256 => IPFSRecord) public records;
    mapping(string => uint256[]) public collectionRecords;
    mapping(address => uint256[]) public userRecords;
    mapping(string => uint256) public hashToRecordId;

    // Contadores
    Counters.Counter private _recordIds;

    // Eventos
    event RecordStored(
        uint256 indexed recordId,
        string indexed collection,
        string ipfsHash,
        string sha256Hash,
        address indexed owner,
        uint256 timestamp
    );

    event RecordUpdated(
        uint256 indexed recordId,
        string ipfsHash,
        string sha256Hash,
        uint256 timestamp
    );

    event RecordDeactivated(
        uint256 indexed recordId,
        address indexed owner,
        uint256 timestamp
    );

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(WRITER_ROLE, msg.sender);
        _grantRole(READER_ROLE, msg.sender);
    }

    /**
     * @dev Almacena un nuevo registro de IPFS
     * @param ipfsHash Hash de IPFS
     * @param sha256Hash Hash SHA256 para verificación
     * @param collection Colección a la que pertenece
     * @param dataType Tipo de datos
     */
    function storeRecord(
        string memory ipfsHash,
        string memory sha256Hash,
        string memory collection,
        string memory dataType
    ) external whenNotPaused onlyRole(WRITER_ROLE) returns (uint256) {
        require(bytes(ipfsHash).length > 0, "IPFS hash cannot be empty");
        require(bytes(sha256Hash).length > 0, "SHA256 hash cannot be empty");
        require(bytes(collection).length > 0, "Collection cannot be empty");

        _recordIds.increment();
        uint256 recordId = _recordIds.current();

        IPFSRecord memory newRecord = IPFSRecord({
            ipfsHash: ipfsHash,
            sha256Hash: sha256Hash,
            collection: collection,
            dataType: dataType,
            owner: msg.sender,
            timestamp: block.timestamp,
            active: true
        });

        records[recordId] = newRecord;
        collectionRecords[collection].push(recordId);
        userRecords[msg.sender].push(recordId);
        hashToRecordId[ipfsHash] = recordId;

        emit RecordStored(
            recordId,
            collection,
            ipfsHash,
            sha256Hash,
            msg.sender,
            block.timestamp
        );

        return recordId;
    }

    /**
     * @dev Actualiza un registro existente
     * @param recordId ID del registro a actualizar
     * @param newIpfsHash Nuevo hash de IPFS
     * @param newSha256Hash Nuevo hash SHA256
     */
    function updateRecord(
        uint256 recordId,
        string memory newIpfsHash,
        string memory newSha256Hash
    ) external whenNotPaused {
        require(records[recordId].active, "Record does not exist or is inactive");
        require(
            records[recordId].owner == msg.sender || hasRole(ADMIN_ROLE, msg.sender),
            "Only owner or admin can update record"
        );
        require(bytes(newIpfsHash).length > 0, "IPFS hash cannot be empty");
        require(bytes(newSha256Hash).length > 0, "SHA256 hash cannot be empty");

        // Remover hash anterior del mapping
        delete hashToRecordId[records[recordId].ipfsHash];

        // Actualizar registro
        records[recordId].ipfsHash = newIpfsHash;
        records[recordId].sha256Hash = newSha256Hash;
        records[recordId].timestamp = block.timestamp;

        // Agregar nuevo hash al mapping
        hashToRecordId[newIpfsHash] = recordId;

        emit RecordUpdated(
            recordId,
            newIpfsHash,
            newSha256Hash,
            block.timestamp
        );
    }

    /**
     * @dev Desactiva un registro
     * @param recordId ID del registro a desactivar
     */
    function deactivateRecord(uint256 recordId) external whenNotPaused {
        require(records[recordId].active, "Record is already inactive");
        require(
            records[recordId].owner == msg.sender || hasRole(ADMIN_ROLE, msg.sender),
            "Only owner or admin can deactivate record"
        );

        records[recordId].active = false;
        delete hashToRecordId[records[recordId].ipfsHash];

        emit RecordDeactivated(
            recordId,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @dev Obtiene un registro por ID
     * @param recordId ID del registro
     * @return IPFSRecord completo
     */
    function getRecord(uint256 recordId) external view returns (IPFSRecord memory) {
        require(records[recordId].active, "Record does not exist or is inactive");
        return records[recordId];
    }

    /**
     * @dev Obtiene un registro por hash de IPFS
     * @param ipfsHash Hash de IPFS
     * @return IPFSRecord completo
     */
    function getRecordByHash(string memory ipfsHash) external view returns (IPFSRecord memory) {
        uint256 recordId = hashToRecordId[ipfsHash];
        require(recordId > 0, "Record not found");
        require(records[recordId].active, "Record is inactive");
        return records[recordId];
    }

    /**
     * @dev Obtiene todos los registros de una colección
     * @param collection Nombre de la colección
     * @return Array de IDs de registros
     */
    function getRecordsByCollection(string memory collection) external view returns (uint256[] memory) {
        return collectionRecords[collection];
    }

    /**
     * @dev Obtiene todos los registros de un usuario
     * @param user Dirección del usuario
     * @return Array de IDs de registros
     */
    function getRecordsByUser(address user) external view returns (uint256[] memory) {
        return userRecords[user];
    }

    /**
     * @dev Obtiene el total de registros
     * @return Total de registros
     */
    function getTotalRecords() external view returns (uint256) {
        return _recordIds.current();
    }

    /**
     * @dev Verifica si un hash existe
     * @param ipfsHash Hash de IPFS
     * @return true si existe, false en caso contrario
     */
    function hashExists(string memory ipfsHash) external view returns (bool) {
        uint256 recordId = hashToRecordId[ipfsHash];
        return recordId > 0 && records[recordId].active;
    }

    // Funciones de administración

    /**
     * @dev Pausa el contrato
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Despausa el contrato
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @dev Otorga rol a una dirección
     * @param role Rol a otorgar
     * @param account Dirección a la que otorgar el rol
     */
    function grantRole(bytes32 role, address account) public override onlyRole(ADMIN_ROLE) {
        super.grantRole(role, account);
    }

    /**
     * @dev Revoca rol de una dirección
     * @param role Rol a revocar
     * @param account Dirección de la que revocar el rol
     */
    function revokeRole(bytes32 role, address account) public override onlyRole(ADMIN_ROLE) {
        super.revokeRole(role, account);
    }
} 