// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CredentialNFT
 * @dev NFT contract for academic credentials
 * Each credential is represented as a unique NFT with IPFS metadata
 */
contract CredentialNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _tokenIds;

    // Mapping from token ID to credential hash
    mapping(uint256 => string) public credentialHashes;
    
    // Mapping from token ID to issuer address
    mapping(uint256 => address) public credentialIssuers;
    
    // Mapping from token ID to revocation status
    mapping(uint256 => bool) public revokedCredentials;
    
    // Mapping to track authorized issuers (institutions)
    mapping(address => bool) public authorizedIssuers;

    event CredentialIssued(
        uint256 indexed tokenId,
        address indexed student,
        address indexed issuer,
        string credentialHash,
        string tokenURI
    );
    
    event CredentialRevoked(
        uint256 indexed tokenId,
        address indexed issuer
    );
    
    event IssuerAuthorized(address indexed issuer);
    event IssuerRevoked(address indexed issuer);

    constructor() ERC721("AcrediaCredential", "ACRED") {}

    /**
     * @dev Override _burn to resolve inheritance conflict
     */
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    /**
     * @dev Authorize an institution to issue credentials
     */
    function authorizeIssuer(address issuer) external onlyOwner {
        authorizedIssuers[issuer] = true;
        emit IssuerAuthorized(issuer);
    }

    /**
     * @dev Revoke issuer authorization
     */
    function revokeIssuer(address issuer) external onlyOwner {
        authorizedIssuers[issuer] = false;
        emit IssuerRevoked(issuer);
    }

    /**
     * @dev Issue a new credential NFT
     * @param student Address of the student receiving the credential
     * @param credentialHash Hash of the credential data
     * @param uri IPFS URI containing credential metadata
     */
    function issueCredential(
        address student,
        string memory credentialHash,
        string memory uri
    ) external returns (uint256) {
        require(
            authorizedIssuers[msg.sender] || msg.sender == owner(),
            "Not authorized to issue credentials"
        );
        require(student != address(0), "Invalid student address");

        _tokenIds++;
        uint256 newTokenId = _tokenIds;

        _safeMint(student, newTokenId);
        _setTokenURI(newTokenId, uri);

        credentialHashes[newTokenId] = credentialHash;
        credentialIssuers[newTokenId] = msg.sender;

        emit CredentialIssued(
            newTokenId,
            student,
            msg.sender,
            credentialHash,
            uri
        );

        return newTokenId;
    }

    /**
     * @dev Revoke a credential
     * @param tokenId ID of the credential to revoke
     */
    function revokeCredential(uint256 tokenId) external {
        require(
            credentialIssuers[tokenId] == msg.sender || msg.sender == owner(),
            "Not authorized to revoke this credential"
        );
        require(!revokedCredentials[tokenId], "Credential already revoked");

        revokedCredentials[tokenId] = true;
        emit CredentialRevoked(tokenId, msg.sender);
    }

    /**
     * @dev Check if a credential is valid (not revoked)
     */
    function isCredentialValid(uint256 tokenId) external view returns (bool) {
        require(_ownerOf(tokenId) != address(0), "Credential does not exist");
        return !revokedCredentials[tokenId];
    }

    /**
     * @dev Get credential details
     */
    function getCredentialDetails(uint256 tokenId)
        external
        view
        returns (
            address owner,
            address issuer,
            string memory credentialHash,
            string memory uri,
            bool isRevoked
        )
    {
        require(_ownerOf(tokenId) != address(0), "Credential does not exist");
        
        return (
            ownerOf(tokenId),
            credentialIssuers[tokenId],
            credentialHashes[tokenId],
            super.tokenURI(tokenId),
            revokedCredentials[tokenId]
        );
    }

    /**
     * @dev Get total number of credentials issued
     */
    function totalCredentials() external view returns (uint256) {
        return _tokenIds;
    }

    // Override required functions
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
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
