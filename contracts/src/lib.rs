#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, Address, Env, String,
};

#[cfg(test)]
extern crate std;

#[contracttype]
pub enum DataKey {
    Initialized,
    Owner,
    PendingOwner,
    NextTokenId,
    Authorized(Address),
    Credential(u64),
    HashIndex(String),
    TotalCredentials,
}

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

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum ContractError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    NoPendingOwner = 3,
    SameOwner = 4,
}

#[contract]
pub struct AcrediaCredential;

fn require_initialized(env: &Env) {
    let initialized = env
        .storage()
        .instance()
        .get::<DataKey, bool>(&DataKey::Initialized)
        .unwrap_or(false);

    if !initialized {
        panic!("ContractError({})", ContractError::NotInitialized as u32);
    }
}

fn read_owner(env: &Env) -> Address {
    require_initialized(env);
    env.storage().instance().get(&DataKey::Owner).unwrap()
}

#[contractimpl]
impl AcrediaCredential {
    pub fn initialize(env: Env, owner: Address) -> Result<(), ContractError> {
        let initialized = env
            .storage()
            .instance()
            .get::<DataKey, bool>(&DataKey::Initialized)
            .unwrap_or(false);

        if initialized {
            return Err(ContractError::AlreadyInitialized);
        }

        owner.require_auth();

        env.storage().instance().set(&DataKey::Initialized, &true);
        env.storage().instance().set(&DataKey::Owner, &owner);
        env.storage().instance().set(&DataKey::NextTokenId, &1u64);
        env.storage().instance().remove(&DataKey::PendingOwner);

        env.events().publish((symbol_short!("own_init"),), owner);

        Ok(())
    }

    pub fn get_owner(env: Env) -> Address {
        read_owner(&env)
    }

    pub fn get_pending_owner(env: Env) -> Option<Address> {
        require_initialized(&env);
        env.storage().instance().get(&DataKey::PendingOwner)
    }

    pub fn transfer_owner(env: Env, new_owner: Address) -> Result<(), ContractError> {
        let owner = read_owner(&env);
        owner.require_auth();

        if owner == new_owner {
            return Err(ContractError::SameOwner);
        }

        env.storage()
            .instance()
            .set(&DataKey::PendingOwner, &new_owner.clone());

        env.events()
            .publish((symbol_short!("own_xfer"), owner), new_owner);

        Ok(())
    }

    pub fn accept_owner(env: Env) -> Result<(), ContractError> {
        let previous_owner = read_owner(&env);
        let pending_owner: Address = env
            .storage()
            .instance()
            .get(&DataKey::PendingOwner)
            .ok_or(ContractError::NoPendingOwner)?;

        pending_owner.require_auth();

        env.storage()
            .instance()
            .set(&DataKey::Owner, &pending_owner.clone());
        env.storage().instance().remove(&DataKey::PendingOwner);

        env.events()
            .publish((symbol_short!("own_acpt"), previous_owner), pending_owner);

        Ok(())
    }

    pub fn authorize_issuer(env: Env, issuer: Address) {
        let owner = read_owner(&env);
        owner.require_auth();

        env.storage()
            .instance()
            .set(&DataKey::Authorized(issuer.clone()), &true);

        env.events().publish((symbol_short!("auth_ok"),), issuer);
    }

    pub fn revoke_issuer(env: Env, issuer: Address) {
        let owner = read_owner(&env);
        owner.require_auth();

        env.storage()
            .instance()
            .remove(&DataKey::Authorized(issuer.clone()));

        env.events().publish((symbol_short!("revoked"),), issuer);
    }

    pub fn is_authorized_issuer(env: Env, issuer: Address) -> bool {
        require_initialized(&env);

        env.storage()
            .instance()
            .get(&DataKey::Authorized(issuer))
            .unwrap_or(false)
    }

    pub fn issue_credential(
        env: Env,
        student: Address,
        issuer: Address,
        credential_hash: String,
        ipfs_uri: String,
    ) -> u64 {
        require_initialized(&env);
        issuer.require_auth();

        let is_authorized: bool = env
            .storage()
            .instance()
            .get(&DataKey::Authorized(issuer.clone()))
            .unwrap_or(false);
        if !is_authorized {
            panic!("Issuer not authorized");
        }

        let token_id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::NextTokenId)
            .unwrap_or(1u64);

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

        env.storage()
            .persistent()
            .set(&DataKey::HashIndex(credential_hash.clone()), &token_id);

        env.storage()
            .instance()
            .set(&DataKey::NextTokenId, &(token_id + 1));

        let current: u64 = env
            .storage()
            .persistent()
            .get(&DataKey::TotalCredentials)
            .unwrap_or(0u64);
        env.storage()
            .persistent()
            .set(&DataKey::TotalCredentials, &(current + 1));

        env.events().publish(
            (symbol_short!("issued"), token_id, student, issuer),
            (credential_hash, ipfs_uri),
        );

        token_id
    }

    pub fn revoke_credential(env: Env, token_id: u64, issuer: Address) {
        require_initialized(&env);
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

    pub fn get_credential(env: Env, token_id: u64) -> Credential {
        require_initialized(&env);

        env.storage()
            .persistent()
            .get(&DataKey::Credential(token_id))
            .unwrap_or_else(|| panic!("Credential not found"))
    }

    pub fn verify_credential(env: Env, credential_hash: String) -> Option<Credential> {
        require_initialized(&env);

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

    pub fn is_revoked(env: Env, token_id: u64) -> bool {
        require_initialized(&env);

        match env
            .storage()
            .persistent()
            .get::<DataKey, Credential>(&DataKey::Credential(token_id))
        {
            Some(credential) => credential.revoked,
            None => false,
        }
    }

    pub fn total_credentials(env: Env) -> u64 {
        require_initialized(&env);

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

    fn create_client(env: &Env) -> AcrediaCredentialClient<'_> {
        let contract_id = env.register_contract(None, AcrediaCredential);
        AcrediaCredentialClient::new(env, &contract_id)
    }

    #[test]
    fn test_initialize() {
        let env = Env::default();
        let contract_id = env.register_contract(None, AcrediaCredential);
        let client = AcrediaCredentialClient::new(&env, &contract_id);
        let owner = Address::generate(&env);

        client.initialize(&owner);

        let stored_owner = client.get_owner();
        assert_eq!(stored_owner, owner);
        assert_eq!(pending_owner, None);
    }

    #[test]
    fn test_initialize_fails_if_called_twice() {
        let env = Env::default();
        let owner = Address::generate(&env);
        let attacker = Address::generate(&env);
        let client = create_client(&env);

        env.mock_all_auths();

        client.initialize(&owner);
        let result = client.try_initialize(&attacker);

        assert_eq!(result, Err(Ok(ContractError::AlreadyInitialized)));
        assert_eq!(client.get_owner(), owner);
    }

    #[test]
    fn test_transfer_owner_requires_acceptance() {
        let env = Env::default();
        let owner = Address::generate(&env);
        let next_owner = Address::generate(&env);
        let client = create_client(&env);

        env.mock_all_auths();

        client.initialize(&owner);
        client.transfer_owner(&next_owner);

        assert_eq!(client.get_owner(), owner);
        assert_eq!(client.get_pending_owner(), Some(next_owner.clone()));

        client.accept_owner();

        assert_eq!(client.get_owner(), next_owner);
        assert_eq!(client.get_pending_owner(), None);
    }

    #[test]
    fn test_issue_and_verify() {
        let env = Env::default();
        let contract_id = env.register_contract(None, AcrediaCredential);
        let client = AcrediaCredentialClient::new(&env, &contract_id);
        let owner = Address::generate(&env);
        let issuer = Address::generate(&env);
        let student = Address::generate(&env);

        env.mock_all_auths();

        client.initialize(&owner);
        client.authorize_issuer(&issuer);

        let hash = String::from_str(&env, "test_hash");
        let ipfs = String::from_str(&env, "ipfs_hash");

        let token_id = client.issue_credential(&student, &issuer, &hash, &ipfs);

        assert_eq!(token_id, 1);

        if let Some(cred) = client.verify_credential(&hash) {
            assert_eq!(cred.token_id, 1);
            assert_eq!(cred.student, student);
        } else {
            panic!("Credential not found");
        }
    }
}
