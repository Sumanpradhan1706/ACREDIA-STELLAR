# ACREDIA

<div align="center">
  <img src="frontend/public/logo.png" alt="Acredia Logo" width="150" />
  
  ### Blockchain-Based Academic Credential Verification System
  
  *Secure, Transparent, and Tamper-Proof Educational Credentials on Stellar Network*

![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript)
![Soroban](https://img.shields.io/badge/Soroban-393939?style=for-the-badge&logo=stellar)
![Stellar](https://img.shields.io/badge/Stellar_Network-05192E?style=for-the-badge)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase)
![IPFS](https://img.shields.io/badge/IPFS-65C2CB?style=for-the-badge&logo=ipfs)

---

### 🎯 Built on Stellar Network

**Cost-effective transactions** • **Fast settlement** • **Decentralized infrastructure** • **Native Soroban contracts**

[🌐 Stellar Network](https://stellar.org) | [📊 Stellar Expert Explorer](https://stellar.expert) | [💧 Get Test XLM](https://laboratory.stellar.org/)

</div>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Why Stellar Network](#-why-stellar-network)
- [The Problem](#-the-problem)
- [Our Solution](#-our-solution)
- [Screenshots](#-screenshots)
- [Key Features](#-key-features)
- [Smart Contracts](#-smart-contracts)
- [Technology Stack](#-technology-stack)
- [System Architecture](#-system-architecture)
- [How It Works](#-how-it-works)
- [Getting Started](#-getting-started)
- [Environment Setup](#-environment-setup)
- [Usage Guide](#-usage-guide)
- [Project Structure](#-project-structure)
- [Team](#-team)

---

## 🌟 Overview

**Acredia** is a revolutionary decentralized platform that transforms how academic credentials are issued, stored, and verified. Built on **Stellar Network**, a decentralized network focused on financial inclusivity and fast, low-cost transfers, Acredia leverages blockchain technology, IPFS, and modern web technologies to eliminate credential fraud, reduce verification time, and provide lifetime access to verified academic records.

### Why Acredia?

Traditional paper-based or centralized digital credentials suffer from:

- Easy forgery and tampering
- Time-consuming verification processes
- Risk of loss or damage
- Limited accessibility
- Centralized control and single points of failure

Acredia solves these problems by creating **immutable, blockchain-verified credentials** that are:

- ✅ Permanent and tamper-proof
- ✅ Instantly verifiable
- ✅ Decentralized and censorship-resistant
- ✅ Accessible anywhere, anytime
- ✅ Privacy-preserving with student control

---

## 🚀 Why Stellar Network?

Acredia is built on **Stellar Network**, a decentralized network focused on providing financial inclusion and fast, low-cost transfers of assets globally:

### Key Benefits

**💰 Cost-Effective Transactions**

- Minimal transaction fees (less than a cent)
- Makes credential issuance affordable for educational institutions worldwide
- Students can claim credentials without significant costs

**⚡ Fast Settlement**

- Transaction finality in 3-5 seconds
- Instant credential verification
- Improved user experience with near-instant confirmations

**🌍 Global Reach & Accessibility**

- Designed for global financial inclusion
- Works on low-bandwidth connections
- Accessible from anywhere in the world

**🔒 Decentralized Infrastructure**

- No single point of failure
- Community-run validator network
- Battle-tested since 2014

**♻️ Energy Efficient**

- Minimal energy consumption
- Uses consensus algorithm designed for efficiency
- Supports sustainable applications

### Network Details

- **Stellar Public Network**: Production network (Network ID: Public Global Stellar Network)
- **Stellar Testnet**: Testing environment with test XLM faucet
- **Block Explorer**: [Stellar Expert](https://stellar.expert)
- **RPC/API Endpoints**: Horizon API for reliable connections
- **Native Currency**: XLM (Lumens)

**Smart Contracts**: Soroban - Stellar's smart contract platform built on Rust

---

## 🎯 The Problem

The current academic credential system faces critical challenges:

1. **Credential Fraud**: Fake degrees and certificates cost employers billions annually
2. **Slow Verification**: Manual verification takes days or weeks
3. **Institutional Dependency**: Students rely on institutions to provide transcripts
4. **Data Loss**: Physical documents can be lost, damaged, or destroyed
5. **Privacy Concerns**: Sharing full credentials when only partial verification is needed

---

## 💡 Our Solution

Acredia creates a **three-layer verification system** powered by Stellar Network:

1. **Blockchain Layer**: Immutable credential records on Stellar Network using Soroban smart contracts
2. **Storage Layer**: Decentralized metadata storage on IPFS
3. **Database Layer**: Fast querying and indexing via Supabase

This architecture ensures credentials are:

- **Permanent**: Stored on blockchain forever
- **Cost-Effective**: Minimal transaction fees on Stellar Network make issuance affordable
- **Fast**: Near-instant transaction settlement
- **Verifiable**: Instant verification via token ID or QR code
- **Decentralized**: No single point of failure
- **Detailed**: Subject-wise marks, grades, and complete academic records
- **Accessible**: Students own their credentials via blockchain accounts

---

## 📸 Screenshots

### Landing Page

<img src="frontend/public/hero.png" alt="Acredia Landing Page" width="800"/>

_Modern, responsive landing page showcasing the platform's features_

### Student Dashboard

<img src="frontend/public/student.png" alt="Student Dashboard" width="800"/>

_Students can view all their credentials with detailed information and blockchain verification_

### Institution Dashboard

<img src="frontend/public/institute.png" alt="Institution Dashboard" width="800"/>

_Institutions can issue credentials with subject-wise marks, grades, and complete academic records_

### Credential Verification

<img src="frontend/public/verify1.png" alt="Verification Page" width="800"/>

_Public verification page with blockchain proof and comprehensive credential details_

<img src="frontend/public/verify2.png" alt="Verification Details" width="800"/>

_Detailed subject-wise performance and blockchain transaction information_

### Admin Panel

<img src="frontend/public/admin.png" alt="Admin Panel" width="800"/>

_Contract owner dashboard for authorizing institutions and monitoring system statistics_

---

## ⚡ Key Features

### For Students

- **Digital Wallet**: Receive credentials as NFTs in your wallet
- **Instant Access**: View all credentials anytime, anywhere
- **Easy Sharing**: Generate QR codes or shareable verification links
- **Subject Details**: Access complete subject-wise marks and grades
- **Lifetime Ownership**: Credentials stored permanently on blockchain

### For Institutions

- **Simple Issuance**: Issue credentials with an intuitive web interface
- **Subject-Wise Records**: Add detailed marks, grades, and performance data
- **Batch Processing**: Upload credentials for multiple students
- **Blockchain Verification**: Each credential is verifiable on-chain
- **Authorization Control**: Admin-approved issuer system

### For Verifiers (Employers/Universities)

- **Instant Verification**: Verify credentials in seconds via token ID or QR code
- **Blockchain Proof**: Direct links to blockchain transactions
- **Complete Details**: View student information, institution, marks, and grades
- **No Login Required**: Public verification page accessible to anyone
- **Tamper-Proof**: Impossible to forge or modify credentials

### For Administrators

- **Authorization Management**: Approve institutions to issue credentials
- **System Statistics**: Real-time dashboard with credential counts
- **Contract Ownership**: Full control over smart contract parameters
- **Security**: Only contract owner can authorize new issuers

---

## 📜 Smart Contracts

Acredia uses smart contracts deployed on **Stellar Network** using **Soroban**:

### ⚠️ Migration in Progress

The Solidity contracts are being migrated to **Soroban (Stellar's native smart contract platform)**.

### CredentialNFT Contract (Planned for Soroban)

**Purpose**: Issue academic credentials as tokens on Stellar Network

**Key Features**:

- Token issuance to student accounts
- Credential metadata linking to IPFS
- Revocation mechanism for invalid credentials
- Authorization system for institutions

**Key Functions** (Soroban version):

- `issue_credential(student, credential_hash, uri)` - Issue new credential token
- `authorize_issuer(issuer)` - Authorize institution to issue credentials (admin only)
- `revoke_credential(token_id)` - Revoke a credential if needed
- `get_credential_hash(token_id)` - Get credential hash by token ID
- `get_issuer(token_id)` - Get issuer address by token ID
- `is_revoked(token_id)` - Check if credential is revoked

### CredentialRegistry Contract (Planned for Soroban)

**Purpose**: Central registry for tracking all credentials on Stellar

**Key Features**:

- Immutable record of all issued credentials
- Efficient lookup by token ID or credential hash
- Timestamp tracking for issuance verification
- Public verification capability

**Key Functions** (Soroban version):

- `register_credential(token_id, student, issuer, credential_hash, ipfs_hash)` - Register credential
- `verify_credential(credential_hash)` - Verify and retrieve credential details
- `get_credential(token_id)` - Get credential by token ID
- `get_all_credentials()` - List all credential hashes
- `get_total_credentials()` - Get total number of credentials issued

### Stellar Testnet Deployment

**Network**: Stellar Testnet  
**RPC Endpoint**: `https://soroban-testnet.stellar.org`  
**Horizon API**: `https://horizon-testnet.stellar.org`  
**Block Explorer**: [Stellar Expert (Testnet)](https://stellar.expert/explorer/testnet)

### Stellar Mainnet Deployment (Production)

**Network**: Stellar Public Network  
**RPC Endpoint**: `https://soroban-mainnet.stellar.org`  
**Horizon API**: `https://horizon.stellar.org`  
**Block Explorer**: [Stellar Expert](https://stellar.expert/explorer/public)

> **📝 Deployment Instructions for Stellar**:
>
> 1. Install Stellar CLI: `curl https://github.com/stellar/rs-soroban-cli/releases/download/latest/soroban-cli-latest-x86_64-unknown-linux-gnu.tar.gz | tar xz`
> 2. Create Stellar account: `soroban config identity generate --name admin`
> 3. Fund testnet account: `soroban config identity fund --identity admin`
> 4. Deploy contracts: `soroban contract deploy --wasm /path/to/contract.wasm --network testnet`
> 5. Update frontend `.env` with contract IDs
> 6. For mainnet, use `--network public`

> **⚠️ Important**: Always verify contract IDs on Stellar Expert before interacting with them. Never trust addresses from unofficial sources.

---

## 🛠 Technology Stack

### Frontend

- **Next.js 16** - React framework with App Router for optimal performance
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Stellar SDK** - Wallet connection and blockchain interactions
- **Lucide React** - Modern icon library

### Blockchain (Stellar)

- **Rust** - Language for Soroban smart contracts
- **Soroban SDK** - Smart contract development on Stellar
- **Stellar Network** - Distributed ledger for credential management
- **Stellar SDK (JavaScript/Python)** - Client library for blockchain interactions
- **Horizon API** - REST API for Stellar network queries

### Storage & Backend

- **IPFS** - Decentralized metadata storage via Thirdweb
- **Supabase** - PostgreSQL database with Row Level Security
- **PostgreSQL** - Relational database for indexing
- **RESTful APIs** - Custom API routes in Next.js

### Development Tools

- **pnpm** - Fast, disk-efficient package manager
- **ESLint** - Code quality
- **Prettier** - Code formatting
- **Git** - Version control

---

## 🏗 System Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[Next.js Application]
        B[React Components]
        C[Stellar SDK]
    end

    subgraph "Blockchain Layer"
        D[CredentialNFT Contract]
        E[CredentialRegistry Contract]
        F[Stellar Network]
    end

    subgraph "Storage Layer"
        G[IPFS Network]
        H[Thirdweb Storage]
    end

    subgraph "Database Layer"
        I[Supabase PostgreSQL]
        J[Row Level Security]
    end

    A --> B
    B --> C
    C --> D
    C --> E
    D --> F
    E --> F
    A --> H
    H --> G
    A --> I
    I --> J

    style A fill:#0ea5e9
    style D fill:#f59e0b
    style E fill:#f59e0b
    style G fill:#8b5cf6
    style I fill:#10b981
```

### Architecture Layers

1. **Presentation Layer**: User interfaces for students, institutions, and verifiers
2. **Application Layer**: Business logic, authentication, and API routes
3. **Blockchain Layer**: Smart contracts deployed on Stellar Network using Soroban for decentralized transaction processing
4. **Storage Layer**: IPFS for decentralized metadata storage ensuring data persistence
5. **Database Layer**: Supabase for fast queries and off-chain indexing with Row Level Security

### Why This Architecture?

**Global Reach**: Stellar Network's infrastructure is designed for global financial inclusion and accessibility

**Cost-Efficiency**: Minimal transaction fees on Stellar Network make the system economically viable for educational institutions worldwide

**Security**: Multi-layer approach ensures data integrity - blockchain for immutability, IPFS for decentralization, and Supabase for access control

**Performance**: Fast transaction settlement on Stellar Network provides excellent user experience

---

## 🔄 How It Works

### Credential Issuance Flow

```mermaid
sequenceDiagram
    participant Institution
    participant Frontend
    participant IPFS
    participant Blockchain
    participant Database
    participant Student

    Institution->>Frontend: Enter credential details
    Frontend->>IPFS: Upload metadata + documents
    IPFS-->>Frontend: Return IPFS hash
    Frontend->>Blockchain: Mint NFT with IPFS hash
    Blockchain-->>Frontend: Transaction confirmed
    Frontend->>Database: Store credential record
    Database-->>Frontend: Success
    Frontend->>Student: Send NFT to wallet
    Frontend-->>Institution: Credential issued successfully
```

### Verification Flow

```mermaid
sequenceDiagram
    participant Verifier
    participant Frontend
    participant Database
    participant IPFS
    participant Blockchain

    Verifier->>Frontend: Enter token ID or scan QR
    Frontend->>Database: Query credential data
    Database-->>Frontend: Return metadata
    Frontend->>IPFS: Fetch detailed metadata
    IPFS-->>Frontend: Return full data
    Frontend->>Blockchain: Verify on-chain status
    Blockchain-->>Frontend: Confirm validity
    Frontend-->>Verifier: Display verification result
```

### Step-by-Step Process

#### For Institutions (Issuing Credentials)

1. **Connect Wallet**: Institution connects authorized wallet (Stellar account)
2. **Enter Student Details**: Name, wallet address, credential type
3. **Add Academic Data**: Degree, major, GPA, issue date
4. **Add Subject Marks**: Subject name, marks obtained, maximum marks, grade
5. **Upload to IPFS**: System uploads metadata to decentralized storage
6. **Record on Blockchain**: Smart contract records credential on Stellar Network
7. **Database Record**: System creates searchable database entry
8. **Confirmation**: Student receives credential on Stellar blockchain

#### For Students (Viewing Credentials)

1. **Login**: Authenticate with email or wallet
2. **Dashboard**: View all issued credentials from Stellar
3. **Details**: Click credential to see complete information stored on Stellar blockchain
4. **Share**: Generate QR code or verification link
5. **Download**: Export credential details or share blockchain proof from Stellar Expert

#### For Verifiers (Checking Credentials)

1. **Access**: Navigate to public verification page (no login required)
2. **Input**: Enter credential token ID or scan QR code
3. **Verification**: System checks Stellar blockchain and IPFS
4. **Results**: View complete credential details with blockchain proof
5. **Confirmation**: Verify authenticity via Stellar Expert blockchain explorer link

---

## 🚀 Getting Started

### Quick Start Guide

> **TL;DR**: Install Stellar CLI → Set up test account → Clone repo → Install dependencies → Configure `.env` files → Deploy Soroban contracts → Run frontend

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **pnpm** (v8 or higher) - Install via: `npm install -g pnpm`
- **Git** - [Download](https://git-scm.com/)
- **Stellar CLI** - [Install Guide](https://developers.stellar.org/docs/build/guides/cli/install)
- **Rust** (for Soroban contracts) - [Install](https://www.rust-lang.org/tools/install)
- **Test XLM Tokens** - Get from [Stellar Testnet Faucet](https://laboratory.stellar.org/)

### Installation

1. **Clone the Repository**

```powershell
git clone https://github.com/thisisouvik/Arcedia.git
cd Arcedia
```

2. **Install Frontend Dependencies**

```powershell
cd frontend
pnpm install
```

3. **Install Contract Dependencies**

```powershell
cd ../contracts
pnpm install
```

### Configuration

4. **Set Up Environment Variables**

Create a `.env.local` file in the `frontend` directory:

```env
# Thirdweb Configuration
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_thirdweb_client_id

# Smart Contract Addresses (Stellar Testnet)
NEXT_PUBLIC_CREDENTIAL_NFT_CONTRACT=your_stellar_contract_id
NEXT_PUBLIC_CREDENTIAL_REGISTRY_CONTRACT=your_stellar_registry_id

# Network Configuration (Stellar)
NEXT_PUBLIC_CHAIN_ID=testnet
NEXT_PUBLIC_NETWORK_NAME=stellarTestnet
NEXT_PUBLIC_NETWORK_PASSPHRASE=Test SDF Network ; September 2015

# Stellar Configuration
NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org
NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# IPFS Storage (via Thirdweb)
NEXT_PUBLIC_NFT_STORAGE_KEY=your_thirdweb_storage_key
```

Create a `.env` file in the `contracts` directory:

```env
# Stellar Account Private Key (for deployment - NEVER commit this!)
PRIVATE_KEY=your_stellar_secret_key

# Network Configuration
STELLAR_NETWORK=testnet  # Use 'public' for mainnet
STELLAR_ADMIN_SECRET_KEY=your_admin_secret_key
```

### Database Setup

5. **Set Up Supabase Database**

Run the following SQL scripts in your Supabase SQL Editor:

```sql
-- Run these in order:
1. frontend/database_schema.sql
2. frontend/FIX_DATABASE_RLS.sql
3. frontend/enable_public_verification.sql
4. frontend/enable_admin_stats.sql
```

### Smart Contract Deployment

6. **Set Up Stellar Account**

```powershell
# Create a new Stellar account
soroban config identity generate --name admin

# Fund your account with test XLM from the faucet
soroban config identity fund --identity admin
```

7. **Deploy Soroban Contracts**

```powershell
cd contracts

# Build Soroban contracts (if migrated from Solidity)
soroban contract build  # Requires Rust toolchain

# Deploy CredentialNFT to Stellar Testnet
soroban contract deploy --wasm path/to/credential_nft.wasm --network testnet

# Deploy CredentialRegistry to Stellar Testnet
soroban contract deploy --wasm path/to/credential_registry.wasm --network testnet

# For Mainnet deployment (production):
soroban contract deploy --wasm path/to/credential_nft.wasm --network public
```

**Note**: After deployment, copy the contract IDs from the console output and update your `frontend/.env.local` file with the new addresses.

For guidance on migrating Solidity contracts to Soroban, see:
- [Soroban Smart Contracts Guide](https://developers.stellar.org/docs/build/smart-contracts/overview)
- [Soroban SDK Documentation](https://github.com/stellar/rs-soroban-sdk)

### Running the Application

8. **Start the Development Server**

```powershell
cd frontend
pnpm dev
```

9. **Open in Browser**

Navigate to [http://localhost:3000](http://localhost:3000)

### Production Build

```powershell
cd frontend
pnpm build
pnpm start
```

---

## ⚙️ Environment Setup

### Getting API Keys

#### Thirdweb Client ID

1. Visit [Thirdweb Dashboard](https://thirdweb.com/dashboard)
2. Create a new project
3. Copy your Client ID
4. Configure for multi-chain support

#### Supabase Setup

1. Create account at [Supabase](https://supabase.com)
2. Create a new project
3. Get your project URL and anon key from Settings > API
4. Run the provided SQL scripts in SQL Editor (in order):
   - `sql/database_schema.sql`
   - `sql/FIX_DATABASE_RLS.sql`
   - `sql/enable_public_verification.sql`
   - `sql/enable_admin_stats.sql`

#### Stellar Account Setup

1. Create Stellar account using Stellar CLI:
   ```bash
   soroban config identity generate --name admin
   ```
2. Fund your account with test XLM:
   ```bash
   soroban config identity fund --identity admin
   ```
3. Get your public key: `soroban config identity address --name admin`
4. For testnet, fund from [Stellar Testnet Faucet](https://laboratory.stellar.org/)

#### NFT.Storage / Thirdweb Storage

1. Visit [Thirdweb Storage](https://thirdweb.com/storage) (recommended)
2. Or use [NFT.Storage](https://nft.storage/) as alternative
3. Generate API token for IPFS uploads

### Wallet Setup for Stellar Network

1. **Install Stellar Wallet** (Options):
   - [Stellar Laboratory](https://laboratory.stellar.org/) - Web-based
   - [Freighter Wallet](https://www.freighter.app/) - Browser extension (recommended)
   - [StellarTerm](https://stellarterm.com/) - Web interface

2. **Create or Import Wallet**:
   - Generate new Stellar keypair or import existing
   - Save your secret key securely (never share!)

3. **Configure for Testnet**:
   - Network: `Stellar Testnet`
   - Horizon API: `https://horizon-testnet.stellar.org`
   - Soroban RPC: `https://soroban-testnet.stellar.org`
   - Network Passphrase: `Test SDF Network ; September 2015`

4. **Get Test XLM Tokens**:
   - Visit [Stellar Testnet Faucet](https://laboratory.stellar.org/)
   - Click "Get Test Network Lumens"
   - Select Account ID
   - Enter your public key
   - Request 10,000 test XLM
   - Tokens arrive instantly

5. **For Mainnet Deployment** (Production):
   - Network: `Stellar Public Network`
   - Horizon API: `https://horizon.stellar.org`
   - Soroban RPC: `https://soroban-mainnet.stellar.org`
   - Network Passphrase: `Public Global Stellar Network ; September 2015`
   - Purchase XLM from exchange or use peer-to-peer transfers

---

## 📖 Usage Guide

### For Administrators

**Authorizing Institutions**

1. Connect the contract owner wallet
2. Navigate to Admin Dashboard
3. Enter institution wallet address
4. Click "Authorize Wallet"
5. Confirm blockchain transaction
6. Institution can now issue credentials

### For Institutions

**Issuing a Credential**

1. Login with authorized institution account
2. Go to Dashboard > Issue Credential tab
3. Fill in student details:
   - Student Name
   - Student Wallet Address
   - Credential Type (Degree, Certificate, etc.)
   - Degree/Major/GPA
   - Issue Date
4. Add subjects (click "+ Add Subject"):
   - Subject Name
   - Marks Obtained
   - Maximum Marks
   - Grade (optional)
5. Click "Issue Credential"
6. Confirm wallet transaction
7. Wait for confirmation
8. Student receives NFT in their wallet

**Viewing Issued Credentials**

1. Go to Dashboard > Issued Credentials tab
2. View all credentials issued by your institution
3. See blockchain transaction hashes
4. Access IPFS metadata links

### For Students

**Viewing Your Credentials**

1. Login with student account
2. Dashboard displays all your credentials
3. Click on any credential to see:
   - Institution details
   - Credential type and dates
   - Subject-wise marks and grades
   - Overall performance statistics
   - Blockchain verification proof

**Sharing Credentials**

1. Click "Share" on any credential
2. Options:
   - Generate QR Code
   - Copy verification link
   - Share token ID
3. Recipients can verify without login

### For Verifiers (Employers/Universities)

**Verifying Credentials**

1. Go to verification page (no login required)
2. Enter credential token ID OR scan QR code
3. View complete credential details:
   - Student information
   - Issuing institution
   - Academic records
   - Subject-wise performance
   - Blockchain proof
4. Click blockchain link to verify on MantleScan
5. Confirm credential is authentic and not revoked on Mantle Network

---

## 📁 Project Structure

### Frontend Directory Structure

```
frontend/
├── public/
│   ├── logo.png                    # Acredia logo
│   ├── Acredia.png                 # Brand assets
│   └── screenshots/                # UI screenshots
├── src/
│   ├── app/
│   │   ├── page.tsx               # Landing page
│   │   ├── layout.tsx             # Root layout with providers
│   │   ├── globals.css            # Global styles
│   │   ├── about/
│   │   │   └── page.tsx           # About page
│   │   ├── admin/
│   │   │   └── page.tsx           # Admin dashboard
│   │   ├── api/
│   │   │   └── admin/
│   │   │       ├── stats/route.ts          # Statistics API
│   │   │       └── update-authorization/   # Authorization sync
│   │   ├── auth/
│   │   │   ├── login/             # Student/Institution login
│   │   │   ├── register/          # User registration
│   │   │   ├── admin-login/       # Admin authentication
│   │   │   └── admin-setup/       # Initial admin setup
│   │   ├── dashboard/
│   │   │   └── page.tsx           # User dashboard
│   │   └── verify/
│   │       └── page.tsx           # Public verification page
│   ├── components/
│   │   ├── institution/
│   │   │   ├── AuthorizeIssuer.tsx           # Authorization UI
│   │   │   ├── CredentialUploadForm.tsx      # Issuance form
│   │   │   └── IssuedCredentialsList.tsx     # Issued credentials
│   │   ├── student/
│   │   │   ├── StudentCredentialsList.tsx    # Student's credentials
│   │   │   ├── QRCodeModal.tsx              # QR code display
│   │   │   └── CredentialDiagnostic.tsx     # Debug component
│   │   ├── verification/
│   │   │   └── (verification components)
│   │   ├── shared/
│   │   │   └── (shared components)
│   │   └── ui/
│   │       ├── button.tsx         # Button component
│   │       ├── card.tsx           # Card component
│   │       ├── input.tsx          # Input component
│   │       ├── form.tsx           # Form components
│   │       └── (other UI primitives)
│   ├── contexts/
│   │   └── AuthContext.tsx        # Authentication context
│   ├── hooks/
│   │   └── useAuth.ts             # Authentication hook
│   ├── lib/
│   │   ├── contracts.ts           # Smart contract interactions
│   │   ├── credentialService.ts   # Credential issuance service
│   │   ├── ipfs.ts                # IPFS upload utilities
│   │   ├── supabase.ts            # Supabase client
│   │   ├── thirdweb.ts            # Thirdweb configuration
│   │   └── utils.ts               # Utility functions
│   └── types/
│       └── index.ts               # TypeScript type definitions
├── package.json                    # Dependencies
├── tsconfig.json                   # TypeScript config
├── next.config.ts                  # Next.js configuration
├── tailwind.config.js              # Tailwind CSS config
├── postcss.config.mjs              # PostCSS config
└── components.json                 # Shadcn UI config
```

### Contracts Directory Structure

```
contracts/
├── contracts/
│   ├── CredentialNFT.sol          # ERC721 NFT contract
│   └── CredentialRegistry.sol     # Credential registry
├── scripts/
│   ├── deploy.js                  # Deployment script
│   └── verify/
│       └── my-contract.js         # Verification script
├── test/
│   └── (test files)
├── artifacts-zk/                   # Compiled artifacts
├── cache-zk/                       # Build cache
├── hardhat.config.js              # Hardhat configuration
└── package.json                    # Dependencies
```

### Database Schema (Supabase)

```
credentials
├── id (uuid)
├── token_id (bigint) - NFT token ID
├── student_id (uuid) - Reference to students
├── institution_id (uuid) - Reference to institutions
├── ipfs_hash (text) - IPFS metadata hash
├── blockchain_hash (text) - Transaction hash
├── metadata (jsonb) - Credential details
├── issued_at (timestamp)
├── revoked (boolean)
├── revoked_at (timestamp)
├── student_wallet_address (text)
└── issuer_wallet_address (text)

students
├── id (uuid)
├── email (text)
├── name (text)
├── wallet_address (text)
└── created_at (timestamp)

institutions
├── id (uuid)
├── email (text)
├── name (text)
├── wallet_address (text)
├── verified (boolean)
└── created_at (timestamp)

verification_logs
├── id (uuid)
├── credential_id (uuid)
├── verified_at (timestamp)
└── verification_result (jsonb)
```

---

## 🔐 Security Features

### Smart Contract Security

- **OpenZeppelin Libraries**: Battle-tested contract implementations
- **Access Control**: Only authorized issuers can mint credentials
- **Ownable Pattern**: Contract owner controls authorization
- **Reentrancy Protection**: Guards against reentrancy attacks

### Application Security

- **Row Level Security (RLS)**: Supabase database policies
- **Wallet Authentication**: Cryptographic signature verification
- **Environment Variables**: Sensitive data never committed
- **HTTPS Only**: All production traffic encrypted
- **Public Verification**: No authentication required for verification

### Data Privacy

- **Student Control**: Students own their credential NFTs
- **Selective Disclosure**: Share only what's necessary
- **IPFS Storage**: Decentralized, censorship-resistant
- **No PII on Blockchain**: Personal data only in IPFS/database

---

## 🎨 Design Philosophy

Acredia follows modern web design principles:

- **Responsive**: Works on desktop, tablet, and mobile
- **Accessible**: WCAG 2.1 compliant components
- **Consistent**: Unified design system with Tailwind CSS
- **Intuitive**: Clear user flows and interactions
- **Professional**: Gradient accents and modern aesthetics
- **Fast**: Optimized with Next.js App Router

---

## 🧪 Testing

### Running Tests

```powershell
# Contract tests (local Hardhat network)
cd contracts
pnpm test

# Compile contracts
pnpm compile

# Frontend tests (if configured)
cd frontend
pnpm test
```

### Testing on Mantle Sepolia

**Before testing, ensure:**

1. MetaMask is connected to Mantle Sepolia Testnet
2. You have sufficient test MNT tokens in your wallet
3. Environment variables are properly configured

### Manual Testing Checklist

**Network & Wallet**

- [ ] MetaMask connected to Mantle Sepolia (Chain ID: 5003)
- [ ] Test MNT tokens available in wallet
- [ ] Contract addresses correct in `.env.local`

**Credential Issuance**

- [ ] Institution can issue credential on Mantle Network
- [ ] Transaction completes within 2-3 seconds
- [ ] Student receives NFT in wallet
- [ ] Metadata uploaded to IPFS successfully
- [ ] Database record created with correct chain data
- [ ] Subject-wise marks displayed correctly
- [ ] Gas fees are minimal (< $0.01)

**Verification**

- [ ] Public verification page loads
- [ ] Token ID search works
- [ ] QR code scanning works
- [ ] MantleScan blockchain link redirects correctly
- [ ] Subject table displays properly
- [ ] Transaction hash verifiable on MantleScan

**Authorization**

- [ ] Admin can authorize institutions
- [ ] Unauthorized wallets cannot issue
- [ ] Authorization status updates in database

---

## 🚧 Roadmap

### Phase 1: Core Features ✅

- [x] Smart contract development
- [x] NFT credential issuance
- [x] IPFS metadata storage
- [x] Public verification page
- [x] Subject-wise marks system

### Phase 2: Enhanced Features 🚧

- [ ] Bulk credential issuance
- [ ] Advanced filtering and search
- [ ] Email notifications
- [ ] PDF certificate generation
- [x] Mantle Network integration (Layer 2 scaling)

### Phase 3: Advanced Features 📋

- [ ] Credential revocation UI
- [ ] Decentralized identity (DID) integration
- [ ] Mobile application
- [ ] API for third-party integrations
- [ ] Analytics dashboard
- [ ] Cross-chain credential verification

### Phase 4: Enterprise Features 🔮

- [ ] Institutional dashboards
- [ ] Batch operations
- [ ] Advanced reporting
- [ ] White-label solutions
- [ ] Compliance tools
- [ ] Mantle Mainnet production deployment

---

## 🐛 Troubleshooting

### Common Issues

**Problem: MetaMask not connecting**

- Solution: Ensure you're on Mantle Sepolia network (Chain ID: 5003) and site permissions are granted
- Add Mantle Sepolia manually if not showing up in network list

**Problem: "Wrong Network" error**

- Solution: Switch to Mantle Sepolia Testnet in MetaMask
- Check that Chain ID is 5003
- Verify RPC endpoint is `https://rpc.sepolia.mantle.xyz`

**Problem: Transaction failing**

- Solution: Check you have enough test MNT tokens in your wallet
- Verify wallet is authorized to issue credentials (for institutions)
- Try increasing gas limit if needed

**Problem: Cannot get test MNT**

- Solution: Visit official [Mantle Sepolia Faucet](https://faucet.sepolia.mantle.xyz)
- Ensure you're requesting for correct wallet address
- Wait 24 hours between faucet requests if rate-limited

**Problem: Contract deployment fails**

- Solution: Verify PRIVATE_KEY is set correctly in `.env` (without 0x prefix)
- Ensure sufficient MNT balance for deployment
- Check Hardhat configuration for correct network settings

**Problem: IPFS upload timeout**

- Solution: Check internet connection or try again later
- Verify Thirdweb client ID is valid
- Consider using alternative IPFS gateway

**Problem: Verification page shows "not found"**

- Solution: Ensure RLS policies are enabled in Supabase (run SQL scripts)
- Check contract addresses in `.env.local` are correct
- Verify token ID exists on blockchain

**Problem: Subjects not displaying**

- Solution: Clear browser cache and reload page
- Ensure IPFS metadata contains subjects array
- Check IPFS gateway is accessible

**Problem: MantleScan verification fails**

- Solution: Ensure MANTLESCAN_API_KEY is set in `.env`
- Check contract is deployed and address is correct
- Wait a few blocks before attempting verification

### Getting Help

- Check `frontend/docs/TROUBLESHOOTING.md` for detailed solutions
- Review console logs for error messages
- Verify all environment variables are set correctly
- Ensure Supabase migrations are applied

---

## 📄 License

This project is currently **unlicensed**. All rights reserved to the Power Button team.

For licensing inquiries, please contact the team.

---

## 🙏 Acknowledgements

Built with amazing open-source technologies:

- [Next.js](https://nextjs.org/) - React framework
- [Mantle Network](https://mantle.xyz/) - High-performance Layer 2 blockchain
- [Thirdweb](https://thirdweb.com/) - Web3 development platform
- [Supabase](https://supabase.com/) - Open-source Firebase alternative
- [Hardhat](https://hardhat.org/) - Ethereum development environment
- [OpenZeppelin](https://openzeppelin.com/) - Secure smart contract library
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Radix UI](https://www.radix-ui.com/) - Accessible component primitives
- [Lucide Icons](https://lucide.dev/) - Beautiful icon library
- [IPFS](https://ipfs.io/) - Decentralized storage network

Special thanks to:

- **Mantle Network** for providing a scalable and cost-effective Layer 2 solution
- The blockchain and open-source community for making this project possible

---


## 📞 Contact & Support

For questions, feedback, or support:

- Open an issue on [GitHub Issues](https://github.com/thisisouvik/Arcedia/issues)
- Check existing issues for solutions

---

<div align="center">
  
### Built with ❤️ by Team Power Button

**Making Academic Credentials Secure, Transparent, and Accessible on Mantle Network**

⭐ Star this repo if you find it helpful!

---

**Powered by Mantle Network** | **Layer 2 Scaling Solution**

</div>

</div>
