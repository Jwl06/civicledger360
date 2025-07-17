# CivicLedger 360 - Decentralized Civic Enforcement Platform

A blockchain-based civic enforcement platform that leverages AI and IoT to improve road safety in India. Built with React, Solidity smart contracts, and deployed on BNB Smart Chain.

## 🚀 Features

### For Citizens
- **Vehicle Registration**: Register vehicles securely on blockchain with hashed details
- **Violation Reporting**: Report traffic violations with photo/video evidence
- **Token Rewards**: Earn CIVIC tokens for valid violation reports
- **Dashboard**: Track violation reports, vehicle details, and token balance
- **Real-time Status**: Monitor report approval status and rewards

### For Government Officers
- **Review System**: Review and approve/reject violation reports
- **Fine Management**: Issue fines for approved violations
- **Analytics Dashboard**: View statistics on violations and collections
- **Bulk Operations**: Handle multiple reports efficiently

## 🏗️ Architecture

### Smart Contracts
- **CivicToken.sol**: ERC20 token for citizen rewards
- **VehicleLedger.sol**: Secure vehicle registration with hashed data
- **ViolationChain.sol**: Violation reporting and management system

### Frontend
- **React + TypeScript**: Modern, type-safe frontend
- **Tailwind CSS**: Responsive, mobile-first design
- **Web3 Integration**: MetaMask wallet connection
- **Context API**: State management for user data and blockchain interactions

### Blockchain
- **BNB Smart Chain**: Cost-effective, fast transactions
- **IPFS Integration**: Decentralized file storage for evidence
- **Smart Contract Security**: Role-based access control and data validation

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Blockchain**: Solidity, Ethers.js, Web3
- **Network**: BNB Smart Chain (Testnet)
- **Storage**: IPFS (simulated)
- **Icons**: Lucide React

## 📦 Smart Contract Deployment

### Prerequisites
1. Install Hardhat: `npm install --save-dev hardhat`
2. Configure BNB Testnet in Hardhat config
3. Get BNB testnet tokens from faucet

### Deployment Commands
```bash
# Deploy CivicToken
npx hardhat run scripts/deploy-civic-token.js --network bsc-testnet

# Deploy VehicleLedger
npx hardhat run scripts/deploy-vehicle-ledger.js --network bsc-testnet

# Deploy ViolationChain
npx hardhat run scripts/deploy-violation-chain.js --network bsc-testnet
```

### Contract Addresses (Update after deployment)
- CivicToken: `0x...`
- VehicleLedger: `0x...`
- ViolationChain: `0x...`

## 🚀 Getting Started

### Installation
```bash
npm install
npm run dev
```

### Wallet Setup
1. Install MetaMask extension
2. Add BNB Smart Chain Testnet
3. Get test BNB from faucet
4. Connect wallet to the application

### Usage Flow
1. **Connect Wallet**: Use MetaMask to connect
2. **Register Vehicle**: Add vehicle details to blockchain
3. **Report Violations**: Upload evidence and submit reports
4. **Earn Rewards**: Get CIVIC tokens for approved reports
5. **Track Progress**: Monitor dashboard for updates

## 🔐 Security Features

- **Data Hashing**: Vehicle details are cryptographically hashed
- **Role-based Access**: Separate permissions for citizens and officers
- **Smart Contract Validation**: Input validation and access controls
- **Immutable Records**: Blockchain ensures data integrity

## 🎯 Future Enhancements

- **AI Integration**: YOLOv8 for automatic violation detection
- **IoT Sensors**: Real-time traffic monitoring
- **DAO Governance**: Community voting on reports
- **Mobile App**: Native iOS/Android applications
- **Advanced Analytics**: ML-powered insights and predictions

## 📊 Token Economics

- **Report Reward**: 10 CIVIC tokens per approved violation
- **Token Supply**: 1,000,000 CIVIC tokens
- **Use Cases**: Platform governance, premium features, marketplace

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- GitHub Issues: [Create an issue](https://github.com/your-repo/issues)
- Documentation: [Wiki](https://github.com/your-repo/wiki)
- Community: [Discord](https://discord.gg/your-discord)

---

Built with ❤️ for improving road safety in India through blockchain technology.