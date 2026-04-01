#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, String};

/// Storage key enum — avoids `format!` (unavailable in no_std)
#[contracttype]
pub enum DataKey {
    Owner,
    NextTokenId,
    Authorized(Address),
    Credential(u64),
    HashIndex(String),
    TotalCredentials,
}

/// Credential struct representing an issued credential
#[contracttype]
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
        env.storage().instance().set(&DataKey::Owner, &owner);
        env.storage().instance().set(&DataKey::NextTokenId, &1u64);
    }

    /// Get contract owner
    pub fn get_owner(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Owner).unwrap()
    }

    /// Authorize an issuer (institution) to issue credentials
    pub fn authorize_issuer(env: Env, issuer: Address) {
        let owner: Address = env.storage().instance().get(&DataKey::Owner).unwrap();
        owner.require_auth();

        env.storage()
            .instance()
            .set(&DataKey::Authorized(issuer.clone()), &true);

        env.events().publish((symbol_short!("auth_ok"),), issuer);
    }

    /// Revoke issuer authorization
    pub fn revoke_issuer(env: Env, issuer: Address) {
        let owner: Address = env.storage().instance().get(&DataKey::Owner).unwrap();
        owner.require_auth();

        env.storage()
            .instance()
            .remove(&DataKey::Authorized(issuer.clone()));

        env.events().publish((symbol_short!("revoked"),), issuer);
    }

    /// Check if an address is authorized to issue credentials
    pub fn is_authorized_issuer(env: Env, issuer: Address) -> bool {
        env.storage()
            .instance()
            .get(&DataKey::Authorized(issuer))
            .unwrap_or(false)
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
        let is_authorized: bool = env
            .storage()
            .instance()
            .get(&DataKey::Authorized(issuer.clone()))
            .unwrap_or(false);
        if !is_authorized {
            panic!("Issuer not authorized");
        }

        // Get next token ID
        let token_id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::NextTokenId)
            .unwrap_or(1u64);

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

        env.storage()
            .persistent()
            .set(&DataKey::Credential(token_id), &credential);

        // Index by credential hash for verification
        env.storage()
            .persistent()
            .set(&DataKey::HashIndex(credential_hash.clone()), &token_id);

        // Update next token ID
        env.storage()
            .instance()
            .set(&DataKey::NextTokenId, &(token_id + 1));

        // Update total count
        let current: u64 = env
            .storage()
            .persistent()
            .get(&DataKey::TotalCredentials)
            .unwrap_or(0u64);
        env.storage()
            .persistent()
            .set(&DataKey::TotalCredentials, &(current + 1));

        // Emit event
        env.events().publish(
            (symbol_short!("issued"), token_id, student, issuer),
            (credential_hash, ipfs_uri),
        );

        token_id
    }

    /// Revoke a credential
    pub fn revoke_credential(env: Env, token_id: u64, issuer: Address) {
        issuer.require_auth();

        let mut credential: Credential = env
            .storage()
            .persistent()
            .get(&DataKey::Credential(token_id))
            .unwrap();

        if credential.issuer != issuer {
            panic!("Only issuer can revoke");
        }
        if credential.revoked {
            panic!("Credential already revoked");
        }

        credential.revoked = true;
        env.storage()
            .persistent()
            .set(&DataKey::Credential(token_id), &credential);

        env.events()
            .publish((symbol_short!("cred_rev"), token_id), issuer);
    }

    /// Get credential details by token ID
    pub fn get_credential(env: Env, token_id: u64) -> Credential {
        env.storage()
            .persistent()
            .get(&DataKey::Credential(token_id))
            .unwrap_or_else(|| panic!("Credential not found"))
    }

    /// Verify credential by credential hash
    pub fn verify_credential(env: Env, credential_hash: String) -> Option<Credential> {
        if let Some(token_id) = env
            .storage()
            .persistent()
            .get::<DataKey, u64>(&DataKey::HashIndex(credential_hash))
        {
            return env
                .storage()
                .persistent()
                .get(&DataKey::Credential(token_id));
        }
        None
    }

    /// Check if credential is revoked
    pub fn is_revoked(env: Env, token_id: u64) -> bool {
        match env
            .storage()
            .persistent()
            .get::<DataKey, Credential>(&DataKey::Credential(token_id))
        {
            Some(credential) => credential.revoked,
            None => false,
        }
    }

    /// Get total credentials issued
    pub fn total_credentials(env: Env) -> u64 {
        env.storage()
            .persistent()
            .get(&DataKey::TotalCredentials)
            .unwrap_or(0u64)
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

        env.mock_all_auths();

        AcrediaCredential::initialize(env.clone(), owner.clone());
        AcrediaCredential::authorize_issuer(env.clone(), issuer.clone());

        let hash = String::from_str(&env, "test_hash");
        let ipfs = String::from_str(&env, "ipfs_hash");

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
