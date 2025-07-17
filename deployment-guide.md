# CivicLedger 360 - Blockchain Deployment Guide

## Step 1: Deploy Smart Contracts to BNB Testnet

### Prerequisites
1. Install MetaMask and add BNB Smart Chain Testnet
2. Get test BNB from faucet: https://testnet.binance.org/faucet-smart
3. Open Remix IDE: https://remix.ethereum.org/

### BNB Smart Chain Testnet Configuration
- **Network Name**: BSC Testnet
- **RPC URL**: https://data-seed-prebsc-1-s1.binance.org:8545/
- **Chain ID**: 97
- **Currency Symbol**: tBNB
- **Block Explorer**: https://testnet.bscscan.com/

### Deployment Steps

#### 1. Deploy CivicToken.sol
1. Copy `contracts/CivicToken.sol` to Remix
2. Compile with Solidity 0.8.19
3. Deploy with your wallet address as constructor parameter
4. **Save the deployed contract address**

#### 2. Deploy VehicleLedger.sol
1. Copy `contracts/VehicleLedger.sol` to Remix
2. Compile with Solidity 0.8.19
3. Deploy (no constructor parameters needed)
4. **Save the deployed contract address**

#### 3. Deploy ViolationChain.sol
1. Copy `contracts/ViolationChain.sol` to Remix
2. Compile with Solidity 0.8.19
3. Deploy with parameters:
   - `_civicToken`: Address of deployed CivicToken
   - `_vehicleLedger`: Address of deployed VehicleLedger
4. **Save the deployed contract address**

#### 4. Configure CivicToken
After deploying ViolationChain, call:
```solidity
civicToken.setViolationChain(violationChainAddress)
```

## Step 2: Update Frontend Configuration

### Update Contract Addresses
Replace the addresses in these files:

#### src/contexts/Web3Context.tsx
```typescript
const CONTRACT_ADDRESSES = {
  CIVIC_TOKEN: 'YOUR_CIVIC_TOKEN_ADDRESS',
  VEHICLE_LEDGER: 'YOUR_VEHICLE_LEDGER_ADDRESS', 
  VIOLATION_CHAIN: 'YOUR_VIOLATION_CHAIN_ADDRESS'
};
```

#### src/contexts/DataContext.tsx
```typescript
const CONTRACT_ADDRESSES = {
  CIVIC_TOKEN: 'YOUR_CIVIC_TOKEN_ADDRESS',
  VEHICLE_LEDGER: 'YOUR_VEHICLE_LEDGER_ADDRESS',
  VIOLATION_CHAIN: 'YOUR_VIOLATION_CHAIN_ADDRESS'
};
```

## Step 3: Get Full Contract ABIs

After compilation in Remix, copy the full ABI from the compilation artifacts and replace the simplified ABIs in:
- `src/contexts/DataContext.tsx`
- `src/contexts/Web3Context.tsx`

## Step 4: Test the Application

### For Citizens:
1. Connect MetaMask wallet
2. Register a vehicle (data will be hashed and stored on blockchain)
3. Report violations
4. Check token balance after approved reports

### For Officers:
1. Add your address as an officer by calling `addOfficer()` on ViolationChain contract
2. Connect wallet and review pending violations
3. Approve/reject reports (this mints tokens to reporters)

## Step 5: Verify Contracts (Optional)

On BSC Testnet explorer:
1. Go to your contract address
2. Click "Verify and Publish"
3. Upload source code and constructor parameters

## Important Notes

1. **Gas Fees**: Each transaction requires tBNB for gas
2. **Data Privacy**: Vehicle details are hashed before blockchain storage
3. **Token Rewards**: 10 CIVIC tokens minted per approved violation
4. **Officer Permissions**: Only contract owner can add/remove officers
5. **IPFS Integration**: Currently simulated - implement real IPFS for production

## Troubleshooting

### Common Issues:
- **Transaction Failed**: Check gas limit and tBNB balance
- **Contract Not Found**: Verify contract addresses are correct
- **Permission Denied**: Ensure wallet is connected and has required permissions
- **Network Error**: Confirm you're on BSC Testnet (Chain ID: 97)

### Debug Steps:
1. Check browser console for detailed error messages
2. Verify contract deployment on BSC Testnet explorer
3. Ensure MetaMask is connected to correct network
4. Confirm contract addresses match deployed contracts

## Production Considerations

1. **Security Audit**: Audit smart contracts before mainnet deployment
2. **IPFS Integration**: Implement real IPFS for image/video storage
3. **Gas Optimization**: Optimize contracts for lower gas costs
4. **Monitoring**: Set up contract event monitoring
5. **Backup**: Implement contract upgrade mechanisms if needed