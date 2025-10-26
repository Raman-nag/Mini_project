import { useWeb3 as useWeb3Context } from '../contexts/Web3Context';

/**
 * Custom hook for wallet connection and Web3 interactions
 * Wraps the Web3Context for easier component usage
 * 
 * @returns {Object} Web3 state and functions
 */
export const useWeb3 = () => {
  const {
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
    shortAddress,
    isSupportedNetwork,
    
    // Functions
    connectWallet,
    disconnectWallet,
    switchNetwork,
    getContract,
    clearError,
  } = useWeb3Context();

  return {
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
    shortAddress,
    isSupportedNetwork,
    
    // Functions
    connectWallet,
    disconnectWallet,
    switchNetwork,
    getContract,
    clearError,
  };
};

export default useWeb3;
