#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, Address, BytesN, Env, String,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum ContractError {
    AlreadyInitialized = 1,
    IssuerNotAuthorized = 2,
    CredentialAlreadyExists = 3,
    CredentialNotFound = 4,
    AlreadyRevoked = 5,
    UnauthorizedRevoker = 6,
    NotInitialized = 7,
    SameOwner = 8,
    NoPendingOwner = 9,
}

#[contracttype]
pub enum DataKey {
    Initialized,
    Owner,
    PendingOwner,
    NextTokenId,
    Authorized(Address),
    Credential(u64),
    HashIndex(BytesN<32>),
    TotalCredentials,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Credential {
    pub token_id: u64,
    pub student: Address,
    pub issuer: Address,
    pub credential_hash: BytesN<32>,
    pub ipfs_hash: String,
    pub issued_at: u64,
    pub revoked: bool,
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
#[allow(deprecated)]
impl AcrediaCredential {
    pub fn initialize(env: Env, owner: Address) -> Result<(), ContractError> {
        if env.storage().instance().has(&DataKey::Owner) {
            return Err(ContractError::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Owner, &owner);
        env.storage().instance().set(&DataKey::Initialized, &true);
        env.storage().instance().set(&DataKey::NextTokenId, &1u64);
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
        env.events().publish((symbol_short!("iss_auth"),), issuer);
    }

    pub fn revoke_issuer(env: Env, issuer: Address) {
        let owner = read_owner(&env);
        owner.require_auth();
        env.storage()
            .instance()
            .remove(&DataKey::Authorized(issuer.clone()));
        env.events().publish((symbol_short!("iss_rev"),), issuer);
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
        credential_hash: BytesN<32>,
        ipfs_uri: String,
    ) -> Result<u64, ContractError> {
        issuer.require_auth();

        let is_authorized: bool = env
            .storage()
            .instance()
            .get(&DataKey::Authorized(issuer.clone()))
            .unwrap_or(false);
        if !is_authorized {
            return Err(ContractError::IssuerNotAuthorized);
        }

        // Reject duplicate hashes — prevents index overwrite
        if env
            .storage()
            .persistent()
            .has(&DataKey::HashIndex(credential_hash.clone()))
        {
            return Err(ContractError::CredentialAlreadyExists);
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
            (symbol_short!("cred_iss"), token_id),
            (student, issuer, credential_hash, ipfs_uri),
        );

        Ok(token_id)
    }

    pub fn revoke_credential(
        env: Env,
        token_id: u64,
        issuer: Address,
    ) -> Result<(), ContractError> {
        issuer.require_auth();

        let mut credential: Credential = env
            .storage()
            .persistent()
            .get(&DataKey::Credential(token_id))
            .ok_or(ContractError::CredentialNotFound)?;

        if credential.issuer != issuer {
            return Err(ContractError::UnauthorizedRevoker);
        }
        if credential.revoked {
            return Err(ContractError::AlreadyRevoked);
        }

        credential.revoked = true;
        env.storage()
            .persistent()
            .set(&DataKey::Credential(token_id), &credential);

        env.events()
            .publish((symbol_short!("cred_rev"), token_id), issuer);

        Ok(())
    }

    pub fn get_credential(env: Env, token_id: u64) -> Result<Credential, ContractError> {
        env.storage()
            .persistent()
            .get(&DataKey::Credential(token_id))
            .ok_or(ContractError::CredentialNotFound)
    }

    pub fn verify_credential(env: Env, credential_hash: BytesN<32>) -> Option<Credential> {
        let token_id: u64 = env
            .storage()
            .persistent()
            .get(&DataKey::HashIndex(credential_hash))?;
        env.storage()
            .persistent()
            .get(&DataKey::Credential(token_id))
    }

    pub fn is_revoked(env: Env, token_id: u64) -> bool {
        env.storage()
            .persistent()
            .get::<DataKey, Credential>(&DataKey::Credential(token_id))
            .map(|c| c.revoked)
            .unwrap_or(false)
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
    use soroban_sdk::testutils::{Address as _, Events, Register};
    use soroban_sdk::{vec, IntoVal, TryIntoVal, Val};

    fn setup() -> (Env, Address, Address, Address, Address) {
        let env = Env::default();
        env.mock_all_auths();
        let contract = AcrediaCredential.register(&env, None, ());
        let owner = Address::generate(&env);
        let issuer = Address::generate(&env);
        let student = Address::generate(&env);
        env.as_contract(&contract, || {
            AcrediaCredential::initialize(env.clone(), owner.clone()).unwrap();
            AcrediaCredential::authorize_issuer(env.clone(), issuer.clone());
        });
        (env, contract, owner, issuer, student)
    }

    fn dummy_hash(env: &Env, seed: u8) -> BytesN<32> {
        BytesN::from_array(env, &[seed; 32])
    }

    fn last_event_topics(env: &Env) -> soroban_sdk::Vec<Val> {
        let events = env.events().all();
        let event = events.events().last().unwrap();
        match &event.body {
            soroban_sdk::xdr::ContractEventBody::V0(event) => {
                event.topics.clone().try_into_val(env).unwrap()
            }
        }
    }

    // ── initialization ────────────────────────────────────────────────────────

    #[test]
    fn test_initialize_once() {
        let env = Env::default();
        env.mock_all_auths();
        let contract = AcrediaCredential.register(&env, None, ());
        let owner = Address::generate(&env);
        env.as_contract(&contract, || {
            assert!(AcrediaCredential::initialize(env.clone(), owner.clone()).is_ok());
            assert_eq!(
                AcrediaCredential::initialize(env.clone(), owner),
                Err(ContractError::AlreadyInitialized)
            );
        });
    }

    // ── issuance ──────────────────────────────────────────────────────────────

    #[test]
    fn test_issue_and_verify() {
        let (env, contract, _, issuer, student) = setup();
        let hash = dummy_hash(&env, 1);
        let ipfs = String::from_str(&env, "ipfs://test");

        env.as_contract(&contract, || {
            let token_id = AcrediaCredential::issue_credential(
                env.clone(),
                student.clone(),
                issuer,
                hash.clone(),
                ipfs,
            )
            .unwrap();

            assert_eq!(token_id, 1);
            let cred = AcrediaCredential::verify_credential(env.clone(), hash).unwrap();
            assert_eq!(cred.token_id, 1);
            assert_eq!(cred.student, student);
        });
    }

    #[test]
    fn test_duplicate_hash_rejected() {
        let (env, contract, _, issuer, student) = setup();
        let hash = dummy_hash(&env, 2);
        let ipfs = String::from_str(&env, "ipfs://a");

        env.as_contract(&contract, || {
            AcrediaCredential::issue_credential(
                env.clone(),
                student.clone(),
                issuer.clone(),
                hash.clone(),
                ipfs.clone(),
            )
            .unwrap();
        });

        env.as_contract(&contract, || {
            let result =
                AcrediaCredential::issue_credential(env.clone(), student, issuer, hash, ipfs);
            assert_eq!(result, Err(ContractError::CredentialAlreadyExists));
        });
    }

    #[test]
    fn test_unauthorized_issuer_rejected() {
        let (env, contract, _, _, student) = setup();
        let rogue = Address::generate(&env);
        env.as_contract(&contract, || {
            let result = AcrediaCredential::issue_credential(
                env.clone(),
                student,
                rogue,
                dummy_hash(&env, 3),
                String::from_str(&env, "ipfs://x"),
            );
            assert_eq!(result, Err(ContractError::IssuerNotAuthorized));
        });
    }

    // ── revocation ────────────────────────────────────────────────────────────

    #[test]
    fn test_revoke_credential() {
        let (env, contract, _, issuer, student) = setup();
        let hash = dummy_hash(&env, 4);
        let token_id = env.as_contract(&contract, || {
            let token_id = AcrediaCredential::issue_credential(
                env.clone(),
                student,
                issuer.clone(),
                hash,
                String::from_str(&env, "ipfs://b"),
            )
            .unwrap();

            assert!(!AcrediaCredential::is_revoked(env.clone(), token_id));
            token_id
        });

        env.as_contract(&contract, || {
            AcrediaCredential::revoke_credential(env.clone(), token_id, issuer).unwrap();
            assert!(AcrediaCredential::is_revoked(env.clone(), token_id));
        });
    }

    #[test]
    fn test_double_revoke_rejected() {
        let (env, contract, _, issuer, student) = setup();
        let token_id = env.as_contract(&contract, || {
            let token_id = AcrediaCredential::issue_credential(
                env.clone(),
                student,
                issuer.clone(),
                dummy_hash(&env, 5),
                String::from_str(&env, "ipfs://c"),
            )
            .unwrap();
            token_id
        });

        env.as_contract(&contract, || {
            AcrediaCredential::revoke_credential(env.clone(), token_id, issuer.clone()).unwrap();
        });

        env.as_contract(&contract, || {
            assert_eq!(
                AcrediaCredential::revoke_credential(env.clone(), token_id, issuer),
                Err(ContractError::AlreadyRevoked)
            );
        });
    }

    #[test]
    fn test_unauthorized_revoker_rejected() {
        let (env, contract, _, issuer, student) = setup();
        let rogue = Address::generate(&env);
        let token_id = env.as_contract(&contract, || {
            let token_id = AcrediaCredential::issue_credential(
                env.clone(),
                student,
                issuer,
                dummy_hash(&env, 6),
                String::from_str(&env, "ipfs://d"),
            )
            .unwrap();
            token_id
        });

        env.as_contract(&contract, || {
            assert_eq!(
                AcrediaCredential::revoke_credential(env.clone(), token_id, rogue),
                Err(ContractError::UnauthorizedRevoker)
            );
        });
    }

    #[test]
    fn test_get_credential_not_found() {
        let (env, contract, _, _, _) = setup();
        env.as_contract(&contract, || {
            assert_eq!(
                AcrediaCredential::get_credential(env.clone(), 999),
                Err(ContractError::CredentialNotFound)
            );
        });
    }

    // ── events ────────────────────────────────────────────────────────────────

    #[test]
    fn test_credential_issued_event() {
        let (env, contract, _, issuer, student) = setup();
        let hash = dummy_hash(&env, 7);
        let ipfs = String::from_str(&env, "ipfs://e");

        let token_id = env.as_contract(&contract, || {
            AcrediaCredential::issue_credential(env.clone(), student, issuer, hash, ipfs).unwrap()
        });

        assert_eq!(
            last_event_topics(&env),
            vec![
                &env,
                symbol_short!("cred_iss").into_val(&env),
                token_id.into_val(&env),
            ]
        );
    }

    #[test]
    fn test_credential_revoked_event() {
        let (env, contract, _, issuer, student) = setup();
        let token_id = env.as_contract(&contract, || {
            let token_id = AcrediaCredential::issue_credential(
                env.clone(),
                student,
                issuer.clone(),
                dummy_hash(&env, 8),
                String::from_str(&env, "ipfs://f"),
            )
            .unwrap();
            token_id
        });
        env.as_contract(&contract, || {
            AcrediaCredential::revoke_credential(env.clone(), token_id, issuer).unwrap();
        });

        assert_eq!(
            last_event_topics(&env),
            vec![
                &env,
                symbol_short!("cred_rev").into_val(&env),
                token_id.into_val(&env),
            ]
        );
    }

    #[test]
    fn test_issuer_authorized_event() {
        let env = Env::default();
        env.mock_all_auths();
        let contract = AcrediaCredential.register(&env, None, ());
        let owner = Address::generate(&env);
        let issuer = Address::generate(&env);
        env.as_contract(&contract, || {
            AcrediaCredential::initialize(env.clone(), owner).unwrap();
            AcrediaCredential::authorize_issuer(env.clone(), issuer);
        });

        assert_eq!(
            last_event_topics(&env),
            vec![&env, symbol_short!("iss_auth").into_val(&env)]
        );
    }

    #[test]
    fn test_issuer_revoked_event() {
        let env = Env::default();
        env.mock_all_auths();
        let contract = AcrediaCredential.register(&env, None, ());
        let owner = Address::generate(&env);
        let issuer = Address::generate(&env);
        env.as_contract(&contract, || {
            AcrediaCredential::initialize(env.clone(), owner).unwrap();
            AcrediaCredential::authorize_issuer(env.clone(), issuer.clone());
        });
        env.as_contract(&contract, || {
            AcrediaCredential::revoke_issuer(env.clone(), issuer);
        });

        assert_eq!(
            last_event_topics(&env),
            vec![&env, symbol_short!("iss_rev").into_val(&env)]
        );
    }

    // ── totals ────────────────────────────────────────────────────────────────

    #[test]
    fn test_total_credentials() {
        let (env, contract, _, issuer, student) = setup();
        env.as_contract(&contract, || {
            assert_eq!(AcrediaCredential::total_credentials(env.clone()), 0);

            AcrediaCredential::issue_credential(
                env.clone(),
                student.clone(),
                issuer.clone(),
                dummy_hash(&env, 9),
                String::from_str(&env, "ipfs://g"),
            )
            .unwrap();
        });
        env.as_contract(&contract, || {
            AcrediaCredential::issue_credential(
                env.clone(),
                student,
                issuer,
                dummy_hash(&env, 10),
                String::from_str(&env, "ipfs://h"),
            )
            .unwrap();

            assert_eq!(AcrediaCredential::total_credentials(env.clone()), 2);
        });
    }
}
