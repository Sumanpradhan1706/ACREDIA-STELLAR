#![no_std]
use soroban_sdk::{contract, contractimpl, Symbol, Env, String, Address, Map, option::Option};

/// Credential struct representing an issued credential
#[derive(Clone)]
pub struct Credential {
    pub token_id: u64,
    pub student: Address,
    pub issuer: Address,
    pub credential_hash: String,
    pub ipfs_hash: String,
    pub issued_at: u64,
    pub revoked: bool,
}

/// AcrediaCredential Smart Contract for Stellar
/// Combines CredentialNFT and CredentialRegistry functionality
/// Manages credential issuance, verification, and authorization
#[contract]
pub struct AcrediaCredential;

#[contractimpl]
impl AcrediaCredential {
    /// Initialize contract with owner
    pub fn initialize(env: Env, owner: Address) {
        let owner_key = Symbol::new(&env, "owner");
        env.storage().instance().set(&owner_key, &owner);
        
        let next_token_key = Symbol::new(&env, "next_token_id");
        env.storage().instance().set(&next_token_key, &1u64);
    }

    /// Get contract owner
    pub fn get_owner(env: Env) -> Address {
        let owner_key = Symbol::new(&env, "owner");
        env.storage().instance().get(&owner_key).unwrap()
    }

    /// Authorize an issuer (institution) to issue credentials
    pub fn authorize_issuer(env: Env, issuer: Address) {
        let owner_key = Symbol::new(&env, "owner");
        let owner: Address = env.storage().instance().get(&owner_key).unwrap();
        owner.require_auth();
        
        let authorized_key = Symbol::new(&env, format!("authorized_{}", issuer).as_str());
        env.storage().instance().set(&authorized_key, &true);
        
        env.events().publish((Symbol::new(&env, "issuer_authorized"),), issuer);
    }

    /// Revoke issuer authorization
    pub fn revoke_issuer(env: Env, issuer: Address) {
        let owner_key = Symbol::new(&env, "owner");
        let owner: Address = env.storage().instance().get(&owner_key).unwrap();
        owner.require_auth();

        let authorized_key = Symbol::new(&env, format!("authorized_{}", issuer).as_str());
        env.storage().instance().remove(&authorized_key);
        
        env.events().publish((Symbol::new(&env, "issuer_revoked"),), issuer);
    }

    /// Check if an address is authorized to issue credentials
    pub fn is_authorized_issuer(env: Env, issuer: Address) -> bool {
        let authorized_key = Symbol::new(&env, format!("authorized_{}", issuer).as_str());
        env.storage().instance().get(&authorized_key).unwrap_or(false)
    }

    /// Issue a new credential to a student
    pub fn issue_credential(
        env: Env,
        student: Address,
        issuer: Address,
        credential_hash: String,
        ipfs_uri: String,
    ) -> u64 {
        issuer.require_auth();

        // Check if issuer is authorized
        let authorized_key = Symbol::new(&env, format!("authorized_{}", issuer).as_str());
        let is_authorized: bool = env.storage().instance().get(&authorized_key).unwrap_or(false);
        require!(is_authorized, "Issuer not authorized");

        // Get next token ID
        let next_token_key = Symbol::new(&env, "next_token_id");
        let token_id: u64 = env.storage().instance().get(&next_token_key).unwrap_or(1u64);

        // Create and store credential
        let credential = Credential {
            token_id,
            student: student.clone(),
            issuer: issuer.clone(),
            credential_hash: credential_hash.clone(),
            ipfs_hash: ipfs_uri.clone(),
            issued_at: env.ledger().timestamp(),
            revoked: false,
        };

        let token_key = Symbol::new(&env, format!("credential_{}", token_id).as_str());
        env.storage().persistent().set(&token_key, &credential);

        // Index by credential hash for verification
        let hash_index_key = Symbol::new(&env, format!("hash_index_{}", credential_hash).as_str());
        env.storage().persistent().set(&hash_index_key, &token_id);

        // Update next token ID
        env.storage().instance().set(&next_token_key, &(token_id + 1));

        // Update total count
        let total_key = Symbol::new(&env, "total_credentials");
        let current: u64 = env.storage().persistent().get(&total_key).unwrap_or(0u64);
        env.storage().persistent().set(&total_key, &(current + 1));

        // Emit event
        env.events().publish(
            (
                Symbol::new(&env, "credential_issued"),
                token_id,
                student,
                issuer,
            ),
            (credential_hash, ipfs_uri),
        );

        token_id
    }

    /// Revoke a credential
    pub fn revoke_credential(env: Env, token_id: u64, issuer: Address) {
        issuer.require_auth();

        let token_key = Symbol::new(&env, format!("credential_{}", token_id).as_str());
        let mut credential: Credential = env.storage().persistent().get(&token_key).unwrap();

        require!(credential.issuer == issuer, "Only issuer can revoke");
        require!(!credential.revoked, "Credential already revoked");

        credential.revoked = true;
        env.storage().persistent().set(&token_key, &credential);

        env.events().publish(
            (Symbol::new(&env, "credential_revoked"), token_id),
            issuer,
        );
    }

    /// Get credential details by token ID
    pub fn get_credential(env: Env, token_id: u64) -> Credential {
        let token_key = Symbol::new(&env, format!("credential_{}", token_id).as_str());
        env.storage()
            .persistent()
            .get(&token_key)
            .unwrap_or_else(|| panic!("Credential not found"))
    }

    /// Verify credential by credential hash
    pub fn verify_credential(env: Env, credential_hash: String) -> Option<Credential> {
        let hash_index_key = Symbol::new(&env, format!("hash_index_{}", credential_hash).as_str());
        
        if let Some(token_id) = env.storage().persistent().get::<_, u64>(&hash_index_key) {
            let token_key = Symbol::new(&env, format!("credential_{}", token_id).as_str());
            return env.storage().persistent().get(&token_key);
        }
        
        None
    }

    /// Check if credential is revoked
    pub fn is_revoked(env: Env, token_id: u64) -> bool {
        let token_key = Symbol::new(&env, format!("credential_{}", token_id).as_str());
        match env.storage().persistent().get::<_, Credential>(&token_key) {
            Some(credential) => credential.revoked,
            None => false,
        }
    }

    /// Get total credentials issued
    pub fn total_credentials(env: Env) -> u64 {
        let total_key = Symbol::new(&env, "total_credentials");
        env.storage().persistent().get(&total_key).unwrap_or(0u64)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::testutils::Address as _;

    #[test]
    fn test_initialize() {
        let env = Env::default();
        let owner = Address::random(&env);
        
        AcrediaCredential::initialize(env.clone(), owner.clone());
        
        let stored_owner = AcrediaCredential::get_owner(env);
        assert_eq!(stored_owner, owner);
    }

    #[test]
    fn test_issue_and_verify() {
        let env = Env::default();
        let owner = Address::random(&env);
        let issuer = Address::random(&env);
        let student = Address::random(&env);
        
        AcrediaCredential::initialize(env.clone(), owner.clone());
        AcrediaCredential::authorize_issuer(env.clone(), issuer.clone());
        
        let hash = String::from_slice(&env, "test_hash");
        let ipfs = String::from_slice(&env, "ipfs_hash");
        
        let token_id = AcrediaCredential::issue_credential(
            env.clone(),
            student.clone(),
            issuer,
            hash.clone(),
            ipfs,
        );
        
        assert_eq!(token_id, 1);
        
        if let Some(cred) = AcrediaCredential::verify_credential(env, hash) {
            assert_eq!(cred.token_id, 1);
            assert_eq!(cred.student, student);
        } else {
            panic!("Credential not found");
        }
    }
}
