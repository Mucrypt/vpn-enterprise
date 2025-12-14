import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import AuthHydrator from '@/components/auth/auth-hydrator';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'VPN Enterprise - Dashboard',
  description: 'Enterprise VPN Management Platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Suppress MetaMask auto-connect if not needed
              if (typeof window !== 'undefined') {
                window.addEventListener('error', function(e) {
                  if (e.message && e.message.includes('MetaMask')) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                  }
                });
                window.addEventListener('unhandledrejection', function(e) {
                  if (e.reason && e.reason.message && e.reason.message.includes('MetaMask')) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                  }
                });
              }
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        data-env={process.env.NODE_ENV}
      >
        <AuthHydrator />
        {children}
      </body>
    </html>
  );
}