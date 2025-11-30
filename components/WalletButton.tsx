'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import NetworkSelector from './NetworkSelector';
import { useNetwork } from './WalletProvider';

export default function WalletButton() {
  const { connected, publicKey, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const { network, setNetwork } = useNetwork();

  const handleConnect = () => {
    setVisible(true);
  };

  const handleDisconnect = () => {
    disconnect();
  };

  if (connected && publicKey) {
    return (
      <div className="flex items-center gap-3">
        <NetworkSelector network={network} onNetworkChange={setNetwork} />
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg border border-gray-200">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <span className="text-sm font-mono text-gray-700">
            {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
          </span>
        </div>
        <button
          onClick={handleDisconnect}
          className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <NetworkSelector network={network} onNetworkChange={setNetwork} />
      <button
        onClick={handleConnect}
        className="px-4 py-1.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors font-medium"
      >
        Connect Wallet
      </button>
    </div>
  );
}

