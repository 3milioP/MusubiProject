// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title P2PMarketplace
 * @dev Implementa el marketplace P2P para intercambio de servicios usando tokens Karma
 */
contract P2PMarketplace is AccessControl, Pausable {
    using Counters for Counters.Counter;
    
    // Contadores
    Counters.Counter private _serviceIdCounter;
    Counters.Counter private _orderIdCounter;
    
    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant FEE_MANAGER_ROLE = keccak256("FEE_MANAGER_ROLE");
    
    // Enums
    enum ServiceStatus { Active, Paused, Deleted }
    enum OrderStatus { Created, Accepted, Completed, Cancelled, Disputed }
    
    // Estructuras
    struct Service {
        uint256 id;
        address provider;
        string title;
        string description;
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
        string details;
        OrderStatus status;
        uint256 createdAt;
        uint256 completedAt;
    }
    
    // Variables de estado
    uint256 public platformFee = 100; // 1% (base 10000)
    address public feeCollector;
    address public krmTokenAddress;
    
    // Mappings
    mapping(uint256 => Service) public services;
    mapping(address => uint256[]) public providerServices;
    mapping(uint256 => Order) public orders;
    mapping(address => uint256[]) public clientOrders;
    mapping(address => uint256[]) public providerOrders;
    
    // Eventos
    event ServiceCreated(uint256 indexed serviceId, address indexed provider);
    event ServiceUpdated(uint256 indexed serviceId);
    event ServiceStatusChanged(uint256 indexed serviceId, ServiceStatus status);
    event OrderCreated(uint256 indexed orderId, uint256 indexed serviceId, address indexed client);
    event OrderAccepted(uint256 indexed orderId);
    event OrderCompleted(uint256 indexed orderId);
    event OrderCancelled(uint256 indexed orderId);
    event OrderDisputed(uint256 indexed orderId);
    event FeeUpdated(uint256 newFee);
    
    /**
     * @dev Constructor
     * @param _feeCollector Dirección que recibe las comisiones
     * @param _krmTokenAddress Dirección del contrato del token KRM
     */
    constructor(address _feeCollector, address _krmTokenAddress) {
        require(_feeCollector != address(0), "Fee collector cannot be zero address");
        require(_krmTokenAddress != address(0), "KRM token address cannot be zero address");
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(FEE_MANAGER_ROLE, msg.sender);
        
        feeCollector = _feeCollector;
        krmTokenAddress = _krmTokenAddress;
    }
    
    /**
     * @dev Crea un nuevo servicio en el marketplace
     * @param title Título del servicio
     * @param description Descripción detallada
     * @param pricePerHour Precio por hora en tokens KRM
     * @param skillIds IDs de las habilidades relacionadas
     */
    function createService(
        string calldata title,
        string calldata description,
        uint256 pricePerHour,
        uint256[] calldata skillIds
    ) external whenNotPaused {
        require(bytes(title).length > 0, "Title cannot be empty");
        require(pricePerHour > 0, "Price must be greater than zero");
        
        uint256 serviceId = _serviceIdCounter.current();
        _serviceIdCounter.increment();
        
        services[serviceId] = Service({
            id: serviceId,
            provider: msg.sender,
            title: title,
            description: description,
            pricePerHour: pricePerHour,
            skillIds: skillIds,
            status: ServiceStatus.Active,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });
        
        providerServices[msg.sender].push(serviceId);
        
        emit ServiceCreated(serviceId, msg.sender);
    }
    
    /**
     * @dev Actualiza un servicio existente
     * @param serviceId ID del servicio
     * @param title Nuevo título
     * @param description Nueva descripción
     * @param pricePerHour Nuevo precio por hora
     * @param skillIds Nuevos IDs de habilidades
     */
    function updateService(
        uint256 serviceId,
        string calldata title,
        string calldata description,
        uint256 pricePerHour,
        uint256[] calldata skillIds
    ) external whenNotPaused {
        Service storage service = services[serviceId];
        
        require(service.provider == msg.sender, "Not service provider");
        require(service.status != ServiceStatus.Deleted, "Service deleted");
        require(bytes(title).length > 0, "Title cannot be empty");
        require(pricePerHour > 0, "Price must be greater than zero");
        
        service.title = title;
        service.description = description;
        service.pricePerHour = pricePerHour;
        service.skillIds = skillIds;
        service.updatedAt = block.timestamp;
        
        emit ServiceUpdated(serviceId);
    }
    
    /**
     * @dev Cambia el estado de un servicio
     * @param serviceId ID del servicio
     * @param status Nuevo estado
     */
    function changeServiceStatus(uint256 serviceId, ServiceStatus status) external whenNotPaused {
        Service storage service = services[serviceId];
        
        require(service.provider == msg.sender, "Not service provider");
        require(service.status != ServiceStatus.Deleted || hasRole(ADMIN_ROLE, msg.sender), "Service deleted");
        
        service.status = status;
        service.updatedAt = block.timestamp;
        
        emit ServiceStatusChanged(serviceId, status);
    }
    
    /**
     * @dev Crea una nueva orden para un servicio
     * @param serviceId ID del servicio
     * @param numHours Número de horas solicitadas
     * @param details Detalles específicos de la solicitud
     */
    function createOrder(
        uint256 serviceId,
        uint256 numHours,
        string calldata details
    ) external whenNotPaused {
        Service storage service = services[serviceId];
        
        require(service.status == ServiceStatus.Active, "Service not active");
        require(service.provider != msg.sender, "Cannot order own service");
        require(numHours > 0, "Hours must be greater than zero");
        
        uint256 totalPrice = service.pricePerHour * numHours;
        
        uint256 orderId = _orderIdCounter.current();
        _orderIdCounter.increment();
        
        orders[orderId] = Order({
            id: orderId,
            serviceId: serviceId,
            client: msg.sender,
            provider: service.provider,
            totalPrice: totalPrice,
            numHours: numHours,
            details: details,
            status: OrderStatus.Created,
            createdAt: block.timestamp,
            completedAt: 0
        });
        
        clientOrders[msg.sender].push(orderId);
        providerOrders[service.provider].push(orderId);
        
        emit OrderCreated(orderId, serviceId, msg.sender);
    }
    
    /**
     * @dev Acepta una orden (proveedor del servicio)
     * @param orderId ID de la orden
     */
    function acceptOrder(uint256 orderId) external whenNotPaused {
        Order storage order = orders[orderId];
        
        require(order.provider == msg.sender, "Not service provider");
        require(order.status == OrderStatus.Created, "Order not in created state");
        
        order.status = OrderStatus.Accepted;
        
        emit OrderAccepted(orderId);
    }
    
    /**
     * @dev Completa una orden (cliente)
     * @param orderId ID de la orden
     */
    function completeOrder(uint256 orderId) external whenNotPaused {
        Order storage order = orders[orderId];
        
        require(order.client == msg.sender, "Not client");
        require(order.status == OrderStatus.Accepted, "Order not accepted");
        
        order.status = OrderStatus.Completed;
        order.completedAt = block.timestamp;
        
        // Aquí se realizaría la transferencia de tokens KRM
        // Requiere integración con el contrato KRMToken
        
        emit OrderCompleted(orderId);
    }
    
    /**
     * @dev Cancela una orden
     * @param orderId ID de la orden
     */
    function cancelOrder(uint256 orderId) external whenNotPaused {
        Order storage order = orders[orderId];
        
        require(order.client == msg.sender || order.provider == msg.sender, "Not authorized");
        require(order.status == OrderStatus.Created || order.status == OrderStatus.Accepted, "Cannot cancel");
        
        order.status = OrderStatus.Cancelled;
        
        emit OrderCancelled(orderId);
    }
    
    /**
     * @dev Disputa una orden
     * @param orderId ID de la orden
     */
    function disputeOrder(uint256 orderId) external whenNotPaused {
        Order storage order = orders[orderId];
        
        require(order.client == msg.sender || order.provider == msg.sender, "Not authorized");
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
    function updateFeeCollector(address newFeeCollector) external onlyRole(ADMIN_ROLE) {
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
