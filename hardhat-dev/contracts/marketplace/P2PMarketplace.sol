// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../tokens/KRMToken.sol";
import "../core/ProfileRegistry.sol";
import "../core/SkillSystem.sol";
import "../core/IPFSRegistry.sol";

/**
 * @title P2PMarketplace
 * @dev Marketplace P2P para servicios profesionales con datos almacenados en IPFS
 * Solo almacena hashes de IPFS y referencias, no datos personales
 */
contract P2PMarketplace is AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant FEE_MANAGER_ROLE = keccak256("FEE_MANAGER_ROLE");
    
    ProfileRegistry public profileRegistry;
    SkillSystem public skillSystem;
    IPFSRegistry public ipfsRegistry;
    KRMToken public krmToken;
    
    struct Service {
        uint256 id;
        address provider;
        string serviceDataHash; // Hash de IPFS con datos del servicio
        uint256 pricePerHour;
        uint256[] skillIds;
        ServiceStatus status;
        uint256 createdAt;
        uint256 updatedAt;
    }
    
    struct Order {
        uint256 id;
        uint256 serviceId;
        address client;
        address provider;
        uint256 totalPrice;
        uint256 numHours;
        string orderDataHash; // Hash de IPFS con datos de la orden
        OrderStatus status;
        uint256 createdAt;
        uint256 completedAt;
    }
    
    enum ServiceStatus { Active, Inactive, Deleted }
    enum OrderStatus { Created, Accepted, Completed, Cancelled, Disputed }
    
    mapping(uint256 => Service) public services;
    mapping(uint256 => Order) public orders;
    mapping(address => uint256[]) public providerServices;
    mapping(address => uint256[]) public clientOrders;
    mapping(address => uint256[]) public providerOrders;
    
    uint256 public platformFee = 100; // 1% base 10000
    address public feeCollector;
    address public krmTokenAddress;
    
    uint256 private _serviceIdCounter;
    uint256 private _orderIdCounter;
    
    event ServiceCreated(uint256 indexed serviceId, address indexed provider, string serviceDataHash);
    event ServiceUpdated(uint256 indexed serviceId, string newServiceDataHash);
    event ServiceStatusChanged(uint256 indexed serviceId, ServiceStatus status);
    event OrderCreated(uint256 indexed orderId, uint256 indexed serviceId, address indexed client, string orderDataHash);
    event OrderAccepted(uint256 indexed orderId);
    event OrderCompleted(uint256 indexed orderId, uint256 amount, uint256 fee);
    event OrderCancelled(uint256 indexed orderId);
    event OrderDisputed(uint256 indexed orderId);
    event FeeUpdated(uint256 newFee);
    
    modifier onlyRegisteredProfile(address wallet) {
        require(profileRegistry.hasRegisteredProfile(wallet), "Profile not registered");
        _;
    }
    
    modifier onlyVerifiedProfile(address wallet) {
        require(profileRegistry.hasVerifiedProfile(wallet), "Profile not verified");
        _;
    }
    
    modifier onlyProfessional(address wallet) {
        require(profileRegistry.getProfile(wallet).profileType == ProfileRegistry.ProfileType.Professional, "Only professionals can provide services");
        _;
    }
    
    modifier serviceExists(uint256 serviceId) {
        require(services[serviceId].provider != address(0), "Service does not exist");
        _;
    }
    
    modifier orderExists(uint256 orderId) {
        require(orders[orderId].client != address(0), "Order does not exist");
        _;
    }
    
    modifier onlyServiceProvider(uint256 serviceId) {
        require(services[serviceId].provider == msg.sender, "Not service provider");
        _;
    }
    
    modifier onlyOrderClient(uint256 orderId) {
        require(orders[orderId].client == msg.sender, "Not order client");
        _;
    }
    
    modifier onlyOrderProvider(uint256 orderId) {
        require(orders[orderId].provider == msg.sender, "Not order provider");
        _;
    }
    
    constructor(address _owner, address _krmToken) {
        require(_owner != address(0), "Owner address cannot be zero");
        require(_krmToken != address(0), "KRM token address cannot be zero");
        
        _grantRole(DEFAULT_ADMIN_ROLE, _owner);
        _grantRole(FEE_MANAGER_ROLE, _owner);
        
        feeCollector = _owner;
        krmTokenAddress = _krmToken;
        krmToken = KRMToken(_krmToken);
    }
    
    /**
     * @dev Configura las direcciones de los contratos relacionados
     * @param _profileRegistry Dirección del ProfileRegistry
     * @param _skillSystem Dirección del SkillSystem
     * @param _ipfsRegistry Dirección del IPFSRegistry
     */
    function setContractAddresses(address _profileRegistry, address _skillSystem, address _ipfsRegistry) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_profileRegistry != address(0), "ProfileRegistry address cannot be zero");
        require(_skillSystem != address(0), "SkillSystem address cannot be zero");
        require(_ipfsRegistry != address(0), "IPFSRegistry address cannot be zero");
        
        profileRegistry = ProfileRegistry(_profileRegistry);
        skillSystem = SkillSystem(_skillSystem);
        ipfsRegistry = IPFSRegistry(_ipfsRegistry);
    }
    
    /**
     * @dev Crea un nuevo servicio con datos en IPFS (solo profesionales registrados)
     * @param serviceDataHash Hash de IPFS con datos del servicio
     * @param pricePerHour Precio por hora en KRM
     * @param skillIds IDs de las habilidades requeridas
     */
    function createService(
        string calldata serviceDataHash,
        uint256 pricePerHour,
        uint256[] calldata skillIds
    ) external whenNotPaused onlyRegisteredProfile(msg.sender) onlyProfessional(msg.sender) {
        require(bytes(serviceDataHash).length > 0, "Service data hash cannot be empty");
        require(ipfsRegistry.hashExists(serviceDataHash), "Service data not found in IPFS");
        require(pricePerHour > 0, "Price must be greater than zero");
        require(skillIds.length > 0, "At least one skill required");
        
        // Si hay SkillSystem configurado, verificar habilidades
        if (address(skillSystem) != address(0)) {
            // Verificar que el profesional tiene las habilidades declaradas y validadas
            for (uint256 i = 0; i < skillIds.length; i++) {
                SkillSystem.DeclaredSkill memory declaredSkill = skillSystem.getDeclaredSkill(msg.sender, skillIds[i]);
                require(declaredSkill.isActive, "Skill not declared by professional");
                require(declaredSkill.isValidated, "Skill not validated");
            }
        }
        
        uint256 serviceId = _serviceIdCounter++;
        
        services[serviceId] = Service({
            id: serviceId,
            provider: msg.sender,
            serviceDataHash: serviceDataHash,
            pricePerHour: pricePerHour,
            skillIds: skillIds,
            status: ServiceStatus.Active,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });
        
        providerServices[msg.sender].push(serviceId);
        
        emit ServiceCreated(serviceId, msg.sender, serviceDataHash);
    }
    
    /**
     * @dev Actualiza un servicio existente
     * @param serviceId ID del servicio
     * @param newServiceDataHash Nuevo hash de IPFS con datos del servicio
     * @param pricePerHour Nuevo precio por hora
     * @param skillIds Nuevos IDs de habilidades
     */
    function updateService(
        uint256 serviceId,
        string calldata newServiceDataHash,
        uint256 pricePerHour,
        uint256[] calldata skillIds
    ) external whenNotPaused serviceExists(serviceId) onlyServiceProvider(serviceId) {
        require(bytes(newServiceDataHash).length > 0, "Service data hash cannot be empty");
        require(ipfsRegistry.hashExists(newServiceDataHash), "Service data not found in IPFS");
        require(pricePerHour > 0, "Price must be greater than zero");
        require(skillIds.length > 0, "At least one skill required");
        
        // Verificar que el profesional tiene las nuevas habilidades
        for (uint256 i = 0; i < skillIds.length; i++) {
            try skillSystem.getDeclaredSkill(msg.sender, skillIds[i]) returns (SkillSystem.DeclaredSkill memory declaredSkill) {
                require(declaredSkill.isActive, "Skill not declared by professional");
                require(declaredSkill.isValidated, "Skill not validated");
            } catch {
                revert("Skill verification failed");
            }
        }
        
        Service storage service = services[serviceId];
        service.serviceDataHash = newServiceDataHash;
        service.pricePerHour = pricePerHour;
        service.skillIds = skillIds;
        service.updatedAt = block.timestamp;
        
        emit ServiceUpdated(serviceId, newServiceDataHash);
    }
    
    /**
     * @dev Cambia el estado de un servicio
     * @param serviceId ID del servicio
     * @param status Nuevo estado
     */
    function changeServiceStatus(uint256 serviceId, ServiceStatus status) external whenNotPaused serviceExists(serviceId) onlyServiceProvider(serviceId) {
        Service storage service = services[serviceId];
        service.status = status;
        service.updatedAt = block.timestamp;
        
        emit ServiceStatusChanged(serviceId, status);
    }
    
    /**
     * @dev Crea una nueva orden para un servicio con datos en IPFS
     * @param serviceId ID del servicio
     * @param numHours Número de horas solicitadas
     * @param orderDataHash Hash de IPFS con datos de la orden
     */
    function createOrder(
        uint256 serviceId,
        uint256 numHours,
        string calldata orderDataHash
    ) external whenNotPaused serviceExists(serviceId) onlyVerifiedProfile(msg.sender) {
        require(bytes(orderDataHash).length > 0, "Order data hash cannot be empty");
        require(ipfsRegistry.hashExists(orderDataHash), "Order data not found in IPFS");
        
        Service storage service = services[serviceId];
        
        require(service.status == ServiceStatus.Active, "Service not active");
        require(service.provider != msg.sender, "Cannot order own service");
        require(numHours > 0, "Hours must be greater than zero");
        
        uint256 totalPrice = service.pricePerHour * numHours;
        
        // Verificar que el cliente tenga suficientes tokens
        require(krmToken.balanceOf(msg.sender) >= totalPrice, "Insufficient KRM balance");
        require(krmToken.allowance(msg.sender, address(this)) >= totalPrice, "Insufficient allowance");
        
        uint256 orderId = _orderIdCounter++;
        
        orders[orderId] = Order({
            id: orderId,
            serviceId: serviceId,
            client: msg.sender,
            provider: service.provider,
            totalPrice: totalPrice,
            numHours: numHours,
            orderDataHash: orderDataHash,
            status: OrderStatus.Created,
            createdAt: block.timestamp,
            completedAt: 0
        });
        
        clientOrders[msg.sender].push(orderId);
        providerOrders[service.provider].push(orderId);
        
        emit OrderCreated(orderId, serviceId, msg.sender, orderDataHash);
    }
    
    /**
     * @dev Acepta una orden (proveedor del servicio)
     * @param orderId ID de la orden
     */
    function acceptOrder(uint256 orderId) external whenNotPaused orderExists(orderId) onlyOrderProvider(orderId) {
        Order storage order = orders[orderId];
        require(order.status == OrderStatus.Created, "Order not in created state");
        
        order.status = OrderStatus.Accepted;
        
        emit OrderAccepted(orderId);
    }
    
    /**
     * @dev Completa una orden (cliente)
     * @param orderId ID de la orden
     */
    function completeOrder(uint256 orderId) external whenNotPaused orderExists(orderId) onlyOrderClient(orderId) {
        Order storage order = orders[orderId];
        require(order.status == OrderStatus.Accepted, "Order not accepted");
        
        order.status = OrderStatus.Completed;
        order.completedAt = block.timestamp;
        
        uint256 amount = order.totalPrice;
        uint256 fee = (amount * platformFee) / 10000;
        uint256 providerAmount = amount - fee;
        
        // Transferir tokens KRM al proveedor (monto neto después de comisión)
        require(krmToken.transferFrom(msg.sender, order.provider, providerAmount), "Provider transfer failed");
        
        // Transferir comisión a la plataforma
        require(krmToken.transferFrom(msg.sender, feeCollector, fee), "Fee transfer failed");
        
        emit OrderCompleted(orderId, amount, fee);
    }
    
    /**
     * @dev Cancela una orden
     * @param orderId ID de la orden
     */
    function cancelOrder(uint256 orderId) external whenNotPaused orderExists(orderId) {
        Order storage order = orders[orderId];
        require(msg.sender == order.client || msg.sender == order.provider, "Not authorized");
        require(order.status == OrderStatus.Created || order.status == OrderStatus.Accepted, "Cannot cancel");
        
        order.status = OrderStatus.Cancelled;
        
        emit OrderCancelled(orderId);
    }
    
    /**
     * @dev Disputa una orden
     * @param orderId ID de la orden
     */
    function disputeOrder(uint256 orderId) external whenNotPaused orderExists(orderId) {
        Order storage order = orders[orderId];
        require(msg.sender == order.client || msg.sender == order.provider, "Not authorized");
        require(order.status != OrderStatus.Cancelled && order.status != OrderStatus.Disputed, "Cannot dispute");
        
        order.status = OrderStatus.Disputed;
        
        emit OrderDisputed(orderId);
    }
    
    /**
     * @dev Actualiza la comisión de la plataforma (solo fee manager)
     * @param newFee Nueva comisión (base 10000)
     */
    function updatePlatformFee(uint256 newFee) external onlyRole(FEE_MANAGER_ROLE) {
        require(newFee <= 1000, "Fee too high"); // Máximo 10%
        platformFee = newFee;
        
        emit FeeUpdated(newFee);
    }
    
    /**
     * @dev Actualiza la dirección que recibe las comisiones (solo admin)
     * @param newFeeCollector Nueva dirección
     */
    function updateFeeCollector(address newFeeCollector) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newFeeCollector != address(0), "Fee collector cannot be zero address");
        feeCollector = newFeeCollector;
    }
    
    /**
     * @dev Obtiene los servicios de un proveedor
     * @param provider Dirección del proveedor
     */
    function getProviderServices(address provider) external view returns (uint256[] memory) {
        return providerServices[provider];
    }
    
    /**
     * @dev Obtiene las órdenes de un cliente
     * @param client Dirección del cliente
     */
    function getClientOrders(address client) external view returns (uint256[] memory) {
        return clientOrders[client];
    }
    
    /**
     * @dev Obtiene las órdenes de un proveedor
     * @param provider Dirección del proveedor
     */
    function getProviderOrders(address provider) external view returns (uint256[] memory) {
        return providerOrders[provider];
    }
    
    /**
     * @dev Devuelve los IDs de órdenes donde el usuario es cliente o proveedor
     * @param user Dirección del usuario
     */
    function getUserOrders(address user) external view returns (uint256[] memory) {
        uint256 clientCount = clientOrders[user].length;
        uint256 providerCount = providerOrders[user].length;
        uint256 total = clientCount + providerCount;
        uint256[] memory allOrders = new uint256[](total);
        for (uint256 i = 0; i < clientCount; i++) {
            allOrders[i] = clientOrders[user][i];
        }
        for (uint256 j = 0; j < providerCount; j++) {
            allOrders[clientCount + j] = providerOrders[user][j];
        }
        return allOrders;
    }
    
    /**
     * @dev Obtiene un servicio por ID
     * @param serviceId ID del servicio
     */
    function getService(uint256 serviceId) external view serviceExists(serviceId) returns (Service memory) {
        return services[serviceId];
    }
    
    /**
     * @dev Obtiene el hash de datos de un servicio
     * @param serviceId ID del servicio
     */
    function getServiceDataHash(uint256 serviceId) external view serviceExists(serviceId) returns (string memory) {
        return services[serviceId].serviceDataHash;
    }
    
    /**
     * @dev Obtiene una orden por ID
     * @param orderId ID de la orden
     */
    function getOrder(uint256 orderId) external view orderExists(orderId) returns (Order memory) {
        return orders[orderId];
    }
    
    /**
     * @dev Obtiene el hash de datos de una orden
     * @param orderId ID de la orden
     */
    function getOrderDataHash(uint256 orderId) external view orderExists(orderId) returns (string memory) {
        return orders[orderId].orderDataHash;
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
