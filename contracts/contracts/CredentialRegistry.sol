// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CredentialRegistry
 * @dev Central registry for tracking all credentials and their metadata
 */
contract CredentialRegistry is Ownable {
    struct CredentialRecord {
        uint256 tokenId;
        address studentWallet;
        address issuerWallet;
        string credentialHash;
        string ipfsHash;
        uint256 issuedAt;
        bool exists;
    }

    // Mapping from credential hash to record
    mapping(string => CredentialRecord) public credentials;
    
    // Mapping from token ID to credential hash
    mapping(uint256 => string) public tokenToHash;
    
    // Array to store all credential hashes
    string[] public allCredentials;

    event CredentialRegistered(
        uint256 indexed tokenId,
        address indexed student,
        address indexed issuer,
        string credentialHash,
        string ipfsHash
    );

    constructor() {}

    /**
     * @dev Register a new credential
     */
    function registerCredential(
        uint256 tokenId,
        address student,
        address issuer,
        string memory credentialHash,
        string memory ipfsHash
    ) external {
        require(student != address(0), "Invalid student address");
        require(issuer != address(0), "Invalid issuer address");
        require(!credentials[credentialHash].exists, "Credential already registered");

        credentials[credentialHash] = CredentialRecord({
            tokenId: tokenId,
            studentWallet: student,
            issuerWallet: issuer,
            credentialHash: credentialHash,
            ipfsHash: ipfsHash,
            issuedAt: block.timestamp,
            exists: true
        });

        tokenToHash[tokenId] = credentialHash;
        allCredentials.push(credentialHash);

        emit CredentialRegistered(
            tokenId,
            student,
            issuer,
            credentialHash,
            ipfsHash
        );
    }

    /**
     * @dev Verify if a credential exists and get its details
     */
    function verifyCredential(string memory credentialHash)
        external
        view
        returns (
            bool exists,
            uint256 tokenId,
            address student,
            address issuer,
            string memory ipfsHash,
            uint256 issuedAt
        )
    {
        CredentialRecord memory record = credentials[credentialHash];
        
        return (
            record.exists,
            record.tokenId,
            record.studentWallet,
            record.issuerWallet,
            record.ipfsHash,
            record.issuedAt
        );
    }

    /**
     * @dev Get credential by token ID
     */
    function getCredentialByTokenId(uint256 tokenId)
        external
        view
        returns (
            bool exists,
            address student,
            address issuer,
            string memory credentialHash,
            string memory ipfsHash,
            uint256 issuedAt
        )
    {
        string memory hash = tokenToHash[tokenId];
        CredentialRecord memory record = credentials[hash];
        
        return (
            record.exists,
            record.studentWallet,
            record.issuerWallet,
            record.credentialHash,
            record.ipfsHash,
            record.issuedAt
        );
    }

    /**
     * @dev Get total number of registered credentials
     */
    function totalCredentials() external view returns (uint256) {
        return allCredentials.length;
    }

    /**
     * @dev Get credentials by student address
     */
    function getCredentialsByStudent(address student)
        external
        view
        returns (string[] memory)
    {
        uint256 count = 0;
        
        // First, count matching credentials
        for (uint256 i = 0; i < allCredentials.length; i++) {
            if (credentials[allCredentials[i]].studentWallet == student) {
                count++;
            }
        }
        
        // Create array and populate
        string[] memory studentCreds = new string[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < allCredentials.length; i++) {
            if (credentials[allCredentials[i]].studentWallet == student) {
                studentCreds[index] = allCredentials[i];
                index++;
            }
        }
        
        return studentCreds;
    }

    /**
     * @dev Get credentials by issuer address
     */
    function getCredentialsByIssuer(address issuer)
        external
        view
        returns (string[] memory)
    {
        uint256 count = 0;
        
        // First, count matching credentials
        for (uint256 i = 0; i < allCredentials.length; i++) {
            if (credentials[allCredentials[i]].issuerWallet == issuer) {
                count++;
            }
        }
        
        // Create array and populate
        string[] memory issuerCreds = new string[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < allCredentials.length; i++) {
            if (credentials[allCredentials[i]].issuerWallet == issuer) {
                issuerCreds[index] = allCredentials[i];
                index++;
            }
        }
        
        return issuerCreds;
    }
}
