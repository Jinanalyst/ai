import type { Metadata } from 'next';
import './globals.css';
import { WalletProvider } from '@/components/WalletProvider';

export const metadata: Metadata = {
  title: 'Chatai - Earn SOL While You Chat',
  description: 'Chat with AI and earn CHAT token',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}

