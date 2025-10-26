# Wallet Connection Component

## Overview

The `WalletConnection` component provides a fully interactive wallet connection interface with mock blockchain integration. It handles connecting to Web3 wallets, displaying wallet information, and managing blockchain interactions.

## Features

### Visual States

1. **Disconnected State**
   - "Connect Wallet" button
   - Gradient background (blue to purple)
   - Loading spinner during connection

2. **Connected State**
   - Truncated wallet address display
   - Network status badge
   - ETH balance display
   - Dropdown menu access

3. **Dropdown Menu**
   - Full account information
   - Network details
   - Balance with refresh
   - Disconnect option
   - Copy address functionality

### Interactive Features

- **Connect Wallet**: Simulates wallet connection with loading states
- **Balance Display**: Shows mock ETH balance with refresh capability
- **Network Badge**: Displays current network name with status indicator
- **Copy Address**: One-click copy to clipboard
- **Disconnect**: Clean disconnection with state reset
- **Error Handling**: Displays and dismisses error messages

## Usage

```jsx
import WalletConnection from '../components/wallet/WalletConnection';

function MyLayout() {
  return (
    <header>
      <WalletConnection />
    </header>
  );
}
```

## Mock Blockchain Integration

All blockchain operations are simulated with delays:

```javascript
// Connect: 1.5s delay
// Fetch Balance: 0.8s delay
// Switch Network: 1.5s delay
```

Console logs indicate where real blockchain calls would occur:
```javascript
console.log('// Blockchain call would happen here: getBalance(account)');
```

## Component Props

This component uses the `useWeb3` hook internally and doesn't accept props.

## Dependencies

- `useWeb3` hook from `../../hooks/useWeb3`
- Heroicons for icons
- Tailwind CSS for styling

## Integration

The component is integrated into:
- `DashboardLayout` - Header for authenticated pages
- `PublicLayout` - Navigation for public pages

## Production Integration

To connect to real blockchain:

1. Replace mock in `Web3Context.connectWallet()`:
```javascript
const accounts = await window.ethereum.request({ 
  method: 'eth_requestAccounts' 
});
```

2. Replace balance fetch:
```javascript
const balance = await web3.eth.getBalance(account);
```

3. Replace network switch:
```javascript
await window.ethereum.request({
  method: 'wallet_switchEthereumChain',
  params: [{ chainId: '0x...' }],
});
```

## Styling

- Responsive design (mobile and desktop)
- Dark mode compatible
- Smooth animations and transitions
- Accessible focus states
