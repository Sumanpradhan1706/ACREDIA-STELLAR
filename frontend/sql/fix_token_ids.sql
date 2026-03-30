-- Fix Token IDs in Database
-- This script helps you update token IDs from blockchain transaction logs

-- Step 1: View all credentials with their current token IDs and blockchain hashes
SELECT 
    id,
    token_id as "current_token_id (wrong)",
    blockchain_hash,
    metadata->'credentialData'->>'studentName' as student_name,
    metadata->'credentialData'->>'credentialType' as credential_type
FROM credentials
ORDER BY issued_at DESC;

-- Step 2: After checking each blockchain_hash on Etherscan (Logs tab),
-- Update each credential with the correct token ID from the blockchain

-- Example updates (replace with your actual values):

-- UPDATE credentials 
-- SET token_id = '4'
-- WHERE blockchain_hash = '0x2e9f3b88bc7e8efe1a4f18281aeefab88a2d717eaf9fb507408234996ca77d9';

-- UPDATE credentials 
-- SET token_id = '5'
-- WHERE blockchain_hash = '0xYOUR_SECOND_TRANSACTION_HASH';

-- UPDATE credentials 
-- SET token_id = '8'
-- WHERE blockchain_hash = '0xYOUR_THIRD_TRANSACTION_HASH';


-- Step 3: Verify the updates
SELECT 
    token_id,
    metadata->'credentialData'->>'studentName' as student_name,
    metadata->'credentialData'->>'credentialType' as credential_type
FROM credentials
ORDER BY CAST(token_id AS INTEGER);


-- HOW TO FIND CORRECT TOKEN IDs:
-- 1. Copy the blockchain_hash from the query above
-- 2. Go to: https://sepolia.etherscan.io/tx/PASTE_HASH_HERE
-- 3. Click the "Logs" tab
-- 4. Find the "CredentialIssued" event
-- 5. The first parameter (tokenId) is the correct token ID
-- 6. It will be a small number like 1, 2, 3, 4, 5, etc.
-- 7. Update the SQL above with the correct token ID and blockchain hash
