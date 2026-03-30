# Acredia Stellar Contracts

Rust-based Soroban smart contracts for Academic Credential Verification on Stellar Network.

## Overview

This repository contains a production-ready Soroban smart contract for Acredia's credential issuance and verification system on Stellar Network.

### AcrediaCredential Contract (`src/lib.rs`)

Single unified contract combining credential issuance, registry, and verification:

**Core Responsibilities**:
1. **Issuance**: Authorize institutions and issue credentials
2. **Storage**: Immutable on-chain credential storage
3. **Verification**: Public credential verification by hash
4. **Management**: Revocation and issuer authorization control

**Key Functions**:
- `initialize(owner)` - Initialize contract with owner
- `authorize_issuer(issuer)` - Authorize an institution to issue
- `revoke_issuer(issuer)` - Revoke institution authorization
- `is_authorized_issuer(issuer)` - Check authorization status
- `issue_credential(student, issuer, hash, uri)` - Issue new credential
- `revoke_credential(token_id, issuer)` - Revoke issued credential
- `get_credential(token_id)` - Get credential by ID
- `verify_credential(hash)` - Verify credential by hash
- `is_revoked(token_id)` - Check revocation status
- `total_credentials()` - Get total credentials issued

## Prerequisites

Before building and deploying, ensure you have:

1. **Rust Toolchain** (1.70.0 or later)
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. **Soroban CLI**
   ```bash
   cargo install --locked soroban-cli
   ```

3. **Stellar Account**
   ```bash
   soroban config identity generate --name admin
   soroban config identity fund --identity admin
   ```

## Project Structure

```
contracts/
├── Cargo.toml                   # Rust package manifest
│   ├── soroban-sdk = "20.3.0"  # Soroban smart contract SDK
├── src/
│   └── lib.rs                   # AcrediaCredential contract
├── README.md                    # This file
└── .gitignore                   # Git ignore rules
```

## Development

### Build Contract

```bash
cd contracts
cargo build --target wasm32-unknown-unknown --release
```

**Output**: `target/wasm32-unknown-unknown/release/acredia_stellar.wasm`

### Run Tests

```bash
cargo test --lib
```

### Format and Lint

```bash
cargo fmt
cargo clippy
cargo check
```

## Deployment Guide

### Step 1: Set Up Testnet

```bash
# Create Stellar identity
soroban config identity generate --name admin

# Fund account with testnet XLM
soroban config identity fund --identity admin

# Verify account
soroban config identity address --name admin
```

### Step 2: Build Contract

```bash
cargo build --target wasm32-unknown-unknown --release
```

### Step 3: Deploy to Stellar Testnet

```bash
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/acredia_stellar.wasm \
  --source admin \
  --network testnet
```

**Save the contract ID** from output (format: `CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`)

### Step 4: Initialize Contract

```bash
# Get your account address
ADMIN_ADDR=$(soroban config identity address --name admin)

# Initialize contract with your address as owner
soroban contract invoke \
  --id <CONTRACT_ID> \
  --source admin \
  --network testnet \
  -- \
  initialize \
  --owner $ADMIN_ADDR
```

### Step 5: Configure Frontend

Update `frontend/.env`:

```env
NEXT_PUBLIC_CREDENTIAL_NFT_CONTRACT=<CONTRACT_ID>
NEXT_PUBLIC_CREDENTIAL_REGISTRY_CONTRACT=<CONTRACT_ID>
NEXT_PUBLIC_CHAIN_ID=testnet
NEXT_PUBLIC_NETWORK_NAME=stellarTestnet
NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org
NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
```

## Production Deployment (Mainnet)

```bash
# Build with optimizations (same command)
cargo build --target wasm32-unknown-unknown --release

# Deploy to Stellar Mainnet
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/acredia_stellar.wasm \
  --source admin \
  --network public
```

Update `frontend/.env`:
```env
NEXT_PUBLIC_HORIZON_URL=https://horizon.stellar.org
NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-mainnet.stellar.org
```

## Contract Operations

### Authorize an Issuer (Institution)

```bash
soroban contract invoke \
  --id <CONTRACT_ID> \
  --source admin \
  --network testnet \
  -- \
  authorize_issuer \
  --issuer <INSTITUTION_ADDRESS>
```

### Issue a Credential

```bash
soroban contract invoke \
  --id <CONTRACT_ID> \
  --source <INSTITUTION_ADDRESS> \
  --network testnet \
  -- \
  issue_credential \
  --student <STUDENT_ADDRESS> \
  --issuer <INSTITUTION_ADDRESS> \
  --credential_hash "credential_hash_value" \
  --ipfs_uri "ipfs_hash_value"
```

### Verify Credential

```bash
soroban contract invoke \
  --id <CONTRACT_ID> \
  --source admin \
  --network testnet \
  -- \
  verify_credential \
  --credential_hash "credential_hash_value"
```

### Check Revocation Status

```bash
soroban contract invoke \
  --id <CONTRACT_ID> \
  --source admin \
  --network testnet \
  -- \
  is_revoked \
  --token_id 1
```

### Revoke a Credential

```bash
soroban contract invoke \
  --id <CONTRACT_ID> \
  --source <INSTITUTION_ADDRESS> \
  --network testnet \
  -- \
  revoke_credential \
  --token_id 1 \
  --issuer <INSTITUTION_ADDRESS>
```

## Contract Verification

View deployed contracts on Stellar Expert:

- **Testnet**: https://stellar.expert/explorer/testnet/contract/<CONTRACT_ID>
- **Mainnet**: https://stellar.expert/explorer/public/contract/<CONTRACT_ID>

## Troubleshooting

### Build Errors
- **Solution**: Update Rust: `rustup update`
- **Solution**: Install Soroban CLI: `cargo install --locked soroban-cli`

### Deployment Fails
- **Check**: Account has XLM for fees: `soroban account info --source admin --network testnet`
- **Check**: Network connectivity: `curl https://horizon-testnet.stellar.org`

### Contract Invocation Issues
- **Debug**: Add `--trace` flag to see detailed logs
- **Check**: Contract ID is correct format (starts with C)
- **Check**: Source account has XLM for fees

## Documentation & Resources

- **[Soroban Documentation](https://developers.stellar.org/docs/learn/stellar-core/soroban-introduction)**
- **[Soroban SDK Repository](https://github.com/stellar/rs-soroban-sdk)**
- **[Stellar CLI Guide](https://developers.stellar.org/docs/build/guides/cli)**
- **[Soroban Examples](https://github.com/stellar/rs-soroban-sdk/tree/master/examples)**
- **[Stellar Laboratory](https://laboratory.stellar.org/)**

## Security Notes

⚠️ **Critical**:
- Never commit private keys or secrets
- Always use separate accounts for testnet and mainnet
- Audit contract code before mainnet deployment
- Verify contract IDs on Stellar Expert before interactions
- Implement proper access control in backend systems
- Monitor for unauthorized issuers

## License

MIT - Academic and Commercial Use

## Support

For issues or questions:
1. Check [Soroban Discord](https://discord.gg/stellardev)
2. Review [Stellar Documentation](https://developers.stellar.org/)
3. Check this repository's issues

```

## Join our Discord!

For any questions, suggestions, join our discord at [https://discord.gg/thirdweb](https://discord.gg/thirdweb).
