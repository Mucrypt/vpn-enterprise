'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-gray-50 to-white p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center text-gray-900">Reset your password</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 mb-4">
              This is a placeholder page. Implement your password reset flow here
              (e.g., request a reset email via your auth provider).
            </p>
            <p className="text-sm text-gray-700">
              Return to{' '}
              <Link href="/auth/login" className="text-blue-600 hover:underline">
                login
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
