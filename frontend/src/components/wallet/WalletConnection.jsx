import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../../hooks/useWeb3';
import {
  WalletIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

const WalletConnection = () => {
  const { isConnected, account, connectWallet, disconnectWallet, networkName, isConnecting, error, clearError } = useWeb3();
  
  const [balance, setBalance] = useState(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNetworkPrompt, setShowNetworkPrompt] = useState(false);

  // Generate mock balance when connected
  useEffect(() => {
    if (isConnected && account) {
      fetchBalance();
    } else {
      setBalance(null);
    }
  }, [isConnected, account]);

  // Mock blockchain call to fetch balance
  const fetchBalance = async () => {
    setIsLoadingBalance(true);
    
    try {
      console.log('// Blockchain call would happen here: getBalance(account)');
      
      // Simulate async blockchain call
      await new Promise(resolve => setTimeout(resolve, 800));

      // Mock ETH balance (random between 0.1 and 10 ETH)
      const mockBalance = (Math.random() * 9.9 + 0.1).toFixed(4);
      setBalance(mockBalance);

      console.log('[Mock] Balance fetched:', mockBalance, 'ETH');
    } catch (err) {
      console.error('Error fetching balance:', err);
      setBalance('0.0000');
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // Handle connect wallet
  const handleConnect = async () => {
    try {
      clearError();
      await connectWallet();
    } catch (err) {
      console.error('Wallet connection error:', err);
    }
  };

  // Handle disconnect
  const handleDisconnect = async () => {
    try {
      await disconnectWallet();
      setShowDropdown(false);
      setBalance(null);
    } catch (err) {
      console.error('Wallet disconnection error:', err);
    }
  };

  // Mock network switch prompt
  const handleSwitchNetwork = async () => {
    try {
      console.log('// Blockchain call would happen here: switchNetwork(chainId)');
      
      // Simulate network switch
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setShowNetworkPrompt(false);
      // Mock successful network switch
      console.log('[Mock] Network switched successfully');
    } catch (err) {
      console.error('Network switch error:', err);
    }
  };

  // Shorten address for display
  const shortenAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Copy address to clipboard
  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(account);
      // You could add a toast notification here
      console.log('Address copied to clipboard');
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex items-center space-x-4">
        {/* Connect Wallet Button */}
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          {isConnecting ? (
            <>
              <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />
              Connecting...
            </>
          ) : (
            <>
              <WalletIcon className="h-5 w-5 mr-2" />
              Connect Wallet
            </>
          )}
        </button>

        {/* Error message */}
        {error && (
          <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 text-sm">
            <ExclamationTriangleIcon className="h-5 w-5" />
            <span>{error}</span>
            <button
              onClick={clearError}
              className="text-red-400 hover:text-red-600"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Connected Wallet Info */}
      <div className="flex items-center space-x-3">
        {/* Network Status Badge */}
        <div className="hidden md:flex items-center px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
          <span className="text-sm font-medium text-green-700 dark:text-green-400">
            {networkName}
          </span>
        </div>

        {/* Balance */}
        <div className="hidden md:flex items-center px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
          <WalletIcon className="h-4 w-4 mr-2 text-slate-600 dark:text-slate-300" />
          {isLoadingBalance ? (
            <div className="flex items-center space-x-2">
              <ArrowPathIcon className="animate-spin h-4 w-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Loading...</span>
            </div>
          ) : (
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {balance} ETH
            </span>
          )}
        </div>

        {/* Wallet Address Button */}
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="inline-flex items-center px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm hover:shadow"
        >
          <CheckCircleIcon className="h-5 w-5 mr-2 text-green-500" />
          <span className="font-mono">{shortenAddress(account)}</span>
          <ChevronDownIcon className="h-4 w-4 ml-2" />
        </button>
      </div>

      {/* Dropdown Menu */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-64 z-50 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-2">
            {/* Account Info */}
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Connected Account</p>
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-slate-900 dark:text-slate-100">
                  {shortenAddress(account)}
                </span>
                <button
                  onClick={copyAddress}
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  title="Copy address"
                >
                  <svg className="h-4 w-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Network */}
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Network</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {networkName}
                </span>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-xs text-green-600 dark:text-green-400">Connected</span>
                </div>
              </div>
            </div>

            {/* Balance */}
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Balance</p>
              {isLoadingBalance ? (
                <div className="flex items-center space-x-2">
                  <ArrowPathIcon className="animate-spin h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-900 dark:text-slate-100">Loading...</span>
                </div>
              ) : (
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {balance} ETH
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="px-2 py-2">
              <button
                onClick={fetchBalance}
                disabled={isLoadingBalance}
                className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <ArrowPathIcon className={`h-4 w-4 mr-2 ${isLoadingBalance ? 'animate-spin' : ''}`} />
                Refresh Balance
              </button>
              <button
                onClick={handleDisconnect}
                className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors mt-1"
              >
                Disconnect
              </button>
            </div>
          </div>
        </>
      )}

      {/* Network Switch Prompt */}
      {showNetworkPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                  Switch Network
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Please switch to the correct network to continue. Would you like to switch to Sepolia Testnet?
                  </p>
                </div>
                <div className="mt-4 flex space-x-3">
                  <button
                    onClick={handleSwitchNetwork}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Switch Network
                  </button>
                  <button
                    onClick={() => setShowNetworkPrompt(false)}
                    className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletConnection;
