// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title ProfileNFT
 * @dev Implementa los NFTs para perfiles gamificados en Musubi
 */
contract ProfileNFT is ERC721, AccessControl, ERC721Enumerable {
    using Counters for Counters.Counter;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    Counters.Counter private _tokenIdCounter;

    // Mapeo de dirección de usuario a su NFT de perfil
    mapping(address => uint256) public userProfiles;

    // Mapeo de tokenId a URI
    mapping(uint256 => string) private _tokenURIs;

    constructor() ERC721("Musubi Profile", "MUSUPROF") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    function safeMint(address to, string memory uri) public onlyRole(MINTER_ROLE) {
        if (userProfiles[to] != 0) {
            require(_exists(userProfiles[to]), "Token does not exist for update");
            _setTokenURI(userProfiles[to], uri);
        } else {
            uint256 tokenId = _tokenIdCounter.current();
            _tokenIdCounter.increment();
            _safeMint(to, tokenId);
            _setTokenURI(tokenId, uri);
            userProfiles[to] = tokenId;
        }
    }

    function updateProfileURI(address user, string memory uri) public onlyRole(MINTER_ROLE) {
        require(userProfiles[user] != 0, "Profile NFT does not exist");
        _setTokenURI(userProfiles[user], uri);
    }

    function getProfileTokenId(address user) public view returns (uint256) {
        return userProfiles[user];
    }

    // Custom URI logic
    function _setTokenURI(uint256 tokenId, string memory uri) internal {
        require(_exists(tokenId), "ERC721Metadata: URI set of nonexistent token");
        _tokenURIs[tokenId] = uri;
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");
        return _tokenURIs[tokenId];
    }

    /**
     * @dev Función pública para quemar (burn) el NFT y limpiar su URI
     */
    function burn(uint256 tokenId) public {
        require(_exists(tokenId), "Token does not exist");
        address owner = ownerOf(tokenId);
        address sender = _msgSender();
        require(
            sender == owner ||
            getApproved(tokenId) == sender ||
            isApprovedForAll(owner, sender) ||
            hasRole(MINTER_ROLE, sender),
            "Not owner or approved or minter"
        );
        _burn(tokenId);
    }

    // Override to clean tokenURI mapping
    function _burn(uint256 tokenId) internal override(ERC721) {
        super._burn(tokenId);
        delete _tokenURIs[tokenId];
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }
}
