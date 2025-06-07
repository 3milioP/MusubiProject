// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title ProfileNFT
 * @dev Implementa los NFTs para perfiles gamificados en Musubi
 */
contract ProfileNFT is ERC721, ERC721URIStorage, AccessControl {
    using Counters for Counters.Counter;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    Counters.Counter private _tokenIdCounter;

    // Mapeo de dirección de usuario a su NFT de perfil
    mapping(address => uint256) public userProfiles;

    constructor() ERC721("Musubi Profile", "MUSUPROF") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    /**
     * @dev Crea un nuevo NFT de perfil para un usuario
     * @param to Dirección del usuario
     * @param uri URI de los metadatos del NFT (IPFS)
     */
    function safeMint(address to, string memory uri) public onlyRole(MINTER_ROLE) {
        // Si el usuario ya tiene un NFT, actualizamos en lugar de crear uno nuevo
        if (userProfiles[to] != 0) {
            _setTokenURI(userProfiles[to], uri);
        } else {
            uint256 tokenId = _tokenIdCounter.current();
            _tokenIdCounter.increment();
            _safeMint(to, tokenId);
            _setTokenURI(tokenId, uri);
            userProfiles[to] = tokenId;
        }
    }

    /**
     * @dev Actualiza los metadatos de un NFT de perfil existente
     * @param user Dirección del usuario
     * @param uri Nueva URI de los metadatos
     */
    function updateProfileURI(address user, string memory uri) public onlyRole(MINTER_ROLE) {
        require(userProfiles[user] != 0, "Profile NFT does not exist");
        _setTokenURI(userProfiles[user], uri);
    }

    /**
     * @dev Obtiene el ID del token de perfil de un usuario
     * @param user Dirección del usuario
     */
    function getProfileTokenId(address user) public view returns (uint256) {
        return userProfiles[user];
    }

    // Funciones requeridas por las interfaces

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
