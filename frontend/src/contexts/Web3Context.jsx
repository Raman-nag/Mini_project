import React, { createContext, useContext, useEffect, useState } from 'react';
import { connectWallet as connectWalletUtil, ensureCorrectNetwork, subscribeWalletEvents, getProvider } from '../utils/web3';

const Web3Context = createContext();

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

export const Web3Provider = ({ children }) => {
  // Wallet connection state
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState(null);
  const [networkId, setNetworkId] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [networkName, setNetworkName] = useState('Unknown');
  
  // Connection status
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  
  // Mock contract instances (placeholder)
  const [contracts, setContracts] = useState({
    EMRSystem: null,
    PatientManagement: null,
    DoctorManagement: null,
    HospitalManagement: null,
  });

  // Check if wallet is already connected (persisted state)
  useEffect(() => {
    const savedAccount = localStorage.getItem('wallet_account');
    const savedNetwork = localStorage.getItem('wallet_network');
    
    if (savedAccount) {
      // Simulate reconnection
      setAccount(savedAccount);
      setIsConnected(true);
      setNetworkId(savedNetwork || '1337'); // Default to localhost
    
      // Get network name
      const network = getNetworkName(savedNetwork || '1337');
      setNetworkName(network);
    }
  }, []);

  // Get network name by chain ID
  const getNetworkName = (chainId) => {
    const networks = {
      '1': 'Ethereum Mainnet',
      '3': 'Ropsten Testnet',
      '4': 'Rinkeby Testnet',
      '5': 'Goerli Testnet',
      '42': 'Kovan Testnet',
      '137': 'Polygon Mainnet',
      '80001': 'Mumbai Testnet',
      '1337': 'Localhost 8545',
      '5777': 'Ganache',
    };
    return networks[chainId] || `Network ${chainId}`;
  };

  // Connect wallet
  const connectWallet = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      await ensureCorrectNetwork();
      const { accounts, provider } = await connectWalletUtil();
      const network = await provider.getNetwork();

      setAccount(accounts[0]);
      setChainId(String(network.chainId));
      setNetworkId(String(network.chainId));
      setNetworkName(getNetworkName(String(network.chainId)));
      setIsConnected(true);

      localStorage.setItem('wallet_account', accounts[0]);
      localStorage.setItem('wallet_network', String(network.chainId));

      // Register listeners
      unsubscribeRef.current?.();
      unsubscribeRef.current = subscribeWalletEvents({
        onAccountsChanged: (accs) => {
          if (accs?.length) {
            setAccount(accs[0]);
            localStorage.setItem('wallet_account', accs[0]);
          } else {
            disconnectWallet();
          }
        },
        onChainChanged: async () => {
          const prov = getProvider();
          const net = await prov.getNetwork();
          setChainId(String(net.chainId));
          setNetworkId(String(net.chainId));
          setNetworkName(getNetworkName(String(net.chainId)));
          localStorage.setItem('wallet_network', String(net.chainId));
        },
      });
      
    } catch (err) {
      console.error('Failed to connect wallet:', err);
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet
  const unsubscribeRef = React.useRef(null);

  const disconnectWallet = () => {
    setIsConnected(false);
    setAccount(null);
    setNetworkId(null);
    setChainId(null);
    setNetworkName('Unknown');
    setContracts({
      EMRSystem: null,
      PatientManagement: null,
      DoctorManagement: null,
      HospitalManagement: null,
    });

    // Clear localStorage
    localStorage.removeItem('wallet_account');
    localStorage.removeItem('wallet_network');

    console.log('Disconnected from wallet');

    // Remove listeners
    unsubscribeRef.current?.();
    unsubscribeRef.current = null;
  };

  // Switch network
  const switchNetwork = async (targetChainId) => {
    try {
      // TODO: Replace with actual network switching
      // In real implementation, this would be:
      // await window.ethereum.request({
      //   method: 'wallet_switchEthereumChain',
      //   params: [{ chainId: targetChainId }],
      // });

      // Mock network switch
      setChainId(targetChainId);
      setNetworkId(targetChainId);
      setNetworkName(getNetworkName(targetChainId));

      // Persist to localStorage
      localStorage.setItem('wallet_network', targetChainId);

      console.log('Switched to network:', getNetworkName(targetChainId));
      
    } catch (err) {
      console.error('Failed to switch network:', err);
      setError(err.message || 'Failed to switch network');
    }
  };

  // Get contract instance
  const getContract = async (contractName) => {
    try {
      // TODO: Replace with actual contract instantiation
      // This is a placeholder for contract instances
      
      if (contracts[contractName]) {
        return contracts[contractName];
      }

      // Mock contract instance
      const mockContract = {
        address: '0x...', // Would be actual deployed address
        methods: {},
        events: {},
      };

      setContracts(prev => ({
        ...prev,
        [contractName]: mockContract,
      }));

      return mockContract;
      
    } catch (err) {
      console.error(`Failed to get contract ${contractName}:`, err);
      setError(err.message || `Failed to get contract ${contractName}`);
      return null;
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Get short account address for display
  const getShortAddress = () => {
    if (!account) return null;
    return `${account.slice(0, 6)}...${account.slice(-4)}`;
  };

  // Check if network is supported
  const isSupportedNetwork = () => {
    const supportedNetworks = ['1337', '5777']; // Localhost networks
    return supportedNetworks.includes(chainId || '');
  };

  const value = {
    // State
    isConnected,
    account,
    networkId,
    chainId,
    networkName,
    isConnecting,
    error,
    contracts,
    
    // Computed
    shortAddress: getShortAddress(),
    isSupportedNetwork: isSupportedNetwork(),
    
    // Functions
    connectWallet,
    disconnectWallet,
    switchNetwork,
    getContract,
    clearError,
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};

export default Web3Context;
