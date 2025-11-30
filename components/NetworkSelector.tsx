'use client';

import { useState, useRef, useEffect } from 'react';

export type Network = 'devnet' | 'mainnet';

interface NetworkSelectorProps {
  network: Network;
  onNetworkChange: (network: Network) => void;
}

export default function NetworkSelector({ network, onNetworkChange }: NetworkSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const networks = [
    { value: 'devnet' as Network, label: 'Devnet', available: true },
    { value: 'mainnet' as Network, label: 'Mainnet', available: false },
  ];

  const currentNetwork = networks.find(n => n.value === network);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors border border-gray-200"
      >
        <div className={`w-2 h-2 rounded-full ${network === 'devnet' ? 'bg-orange-500' : 'bg-green-500'}`} />
        <span className="font-medium text-gray-700">{currentNetwork?.label}</span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          {networks.map((net) => (
            <button
              key={net.value}
              onClick={() => {
                if (net.available) {
                  onNetworkChange(net.value);
                  setIsOpen(false);
                }
              }}
              disabled={!net.available}
              className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between ${
                net.available
                  ? 'hover:bg-gray-50 cursor-pointer'
                  : 'opacity-50 cursor-not-allowed'
              } ${network === net.value ? 'bg-gray-50' : ''}`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${net.value === 'devnet' ? 'bg-orange-500' : 'bg-green-500'}`} />
                <span className="font-medium text-gray-700">{net.label}</span>
              </div>
              {!net.available && (
                <span className="text-xs text-gray-400 font-medium">Soon</span>
              )}
              {network === net.value && (
                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
