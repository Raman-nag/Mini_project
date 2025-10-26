# Multimedia EHR - Frontend

A professional healthcare application built with React, featuring blockchain integration, IPFS storage, and comprehensive medical record management.

## 🚀 Features

### Core Features
- **Blockchain-Powered**: Secure medical records on Ethereum
- **IPFS Storage**: Decentralized document storage
- **Role-Based Access**: Hospital, Doctor, and Patient dashboards
- **Real-Time Updates**: Live notifications and activity feeds
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Dark Mode**: Full dark mode support

### Technical Highlights
- React 18 with Hooks
- React Router v6 for navigation
- Web3 integration for blockchain
- Toast notifications (react-hot-toast)
- Custom animations and transitions
- Error boundaries and loading states
- Accessibility (ARIA labels, keyboard navigation)

## 📦 Installation

1. **Navigate to the frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   VITE_CONTRACT_ADDRESS=0x...
   VITE_NETWORK_ID=1337
   VITE_IPFS_GATEWAY=https://ipfs.io/ipfs
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:5173
   ```

## 🛠️ Available Scripts

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Production Build
```bash
npm run build        # Create optimized production build
npm run preview      # Preview the production build locally
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/       # Reusable React components
│   │   ├── common/       # Shared components (Button, Card, etc.)
│   │   ├── patient/      # Patient-specific components
│   │   ├── doctor/       # Doctor-specific components
│   │   ├── hospital/     # Hospital-specific components
│   │   ├── layout/       # Layout components
│   │   └── wallet/       # Wallet connection components
│   ├── contexts/         # React Context providers
│   │   ├── ThemeContext.jsx
│   │   ├── Web3Context.jsx
│   │   ├── AuthContext.jsx
│   │   ├── ToastContext.jsx
│   │   └── IPFSContext.jsx
│   ├── hooks/            # Custom React hooks
│   │   ├── useWeb3.js
│   │   ├── useAuth.js
│   │   ├── useContract.js
│   │   └── useIPFS.js
│   ├── services/         # API and business logic
│   │   ├── hospitalService.js
│   │   ├── doctorService.js
│   │   ├── patientService.js
│   │   └── ipfsService.js
│   ├── pages/            # Page components
│   ├── routes/           # Routing configuration
│   ├── styles/           # Global styles and CSS
│   ├── utils/            # Utility functions
│   └── data/             # Mock data
├── public/               # Static assets
└── dist/                 # Production build output
```

## 🎨 Key Components

### Layouts
- **PublicLayout**: Landing page and public-facing pages
- **AuthLayout**: Login and registration pages
- **DashboardLayout**: User dashboards (Hospital/Doctor/Patient)

### Common Components
- **WalletConnection**: Web3 wallet integration
- **ErrorBoundary**: Error handling component
- **PageLoader**: Loading states
- **Toast Notifications**: User feedback

### Context Providers
- **ThemeContext**: Dark/light theme management
- **Web3Context**: Blockchain wallet connection
- **AuthContext**: User authentication
- **ToastContext**: Notification system
- **IPFSContext**: Decentralized storage

## 🔧 Configuration

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_CONTRACT_ADDRESS` | Ethereum contract address | `0x742d35...` |
| `VITE_NETWORK_ID` | Network chain ID | `1337` |
| `VITE_NETWORK_NAME` | Network name | `Localhost` |
| `VITE_IPFS_GATEWAY` | IPFS gateway URL | `https://ipfs.io/ipfs` |
| `VITE_PINATA_API_KEY` | Pinata API key | `your_key` |
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:3000/api` |

### Tailwind Configuration
Custom configuration in `tailwind.config.js`:
- Custom color palette for healthcare
- Animations and transitions
- Responsive breakpoints
- Dark mode support

## 🎯 Features by Role

### Patient Dashboard
- View medical history timeline
- Access prescriptions
- Grant/revoke access to records
- Download medical documents
- View appointment history

### Doctor Dashboard
- Manage patients
- Create medical records
- Write prescriptions
- Upload medical documents
- View patient history

### Hospital Dashboard
- Manage doctors and staff
- Register new patients
- View analytics and reports
- Manage permissions
- System administration

## 🔐 Authentication

The application supports three user roles:
1. **Patient**: Access to own medical records
2. **Doctor**: Create and manage records
3. **Hospital**: Administrative functions

Authentication is mock for now but ready for blockchain integration.

## 🌐 Web3 Integration

### Wallet Connection
- MetaMask integration ready
- Network switching support
- Balance display
- Transaction signing

### Blockchain Features
- Smart contract interactions
- Transaction history
- IPFS hash storage
- Gas fee estimation

## 📱 Responsive Design

Breakpoints:
- **Mobile**: 375px - 767px
- **Tablet**: 768px - 1023px
- **Desktop**: 1024px - 1439px
- **Large Desktop**: 1440px+

## ♿ Accessibility

- ARIA labels on all interactive elements
- Keyboard navigation support
- Focus indicators
- Screen reader friendly
- WCAG 2.1 compliant colors
- Semantic HTML

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run linting
npm run lint
```

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
```bash
vercel
```

### Deploy to Netlify
```bash
netlify deploy --prod
```

## 🐛 Troubleshooting

### Wallet Connection Issues
- Ensure MetaMask is installed
- Check network configuration
- Verify contract address

### Build Issues
- Clear `node_modules` and reinstall
- Check Node.js version (16+)
- Verify environment variables

## 📝 Code Style

- ESLint configuration included
- Prettier formatting
- Component-based architecture
- Custom hooks for logic reuse

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- React community
- Ethereum Foundation
- IPFS project
- Tailwind CSS
- Heroicons

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Contact the development team
- Check documentation in `/docs`

---

**Built with ❤️ for healthcare**
