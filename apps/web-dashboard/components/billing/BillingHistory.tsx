'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Download, FileText, CreditCard, Calendar } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Transaction {
  id: string
  amount: number
  type: 'credit' | 'debit'
  service_type?: string
  operation: string
  status: string
  created_at: string
  metadata?: any
}

interface Invoice {
  id: string
  amount_due: number
  amount_paid: number
  status: string
  created_at: string
  period_start: string
  period_end: string
  invoice_pdf?: string
}

interface BillingHistoryProps {
  transactions: Transaction[]
  invoices: Invoice[]
  loading?: boolean
}

export function BillingHistory({
  transactions = [],
  invoices = [],
  loading,
}: BillingHistoryProps) {
  const downloadInvoice = async (invoiceUrl: string) => {
    window.open(invoiceUrl, '_blank')
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className='h-6 w-32 animate-pulse rounded bg-gray-200' />
          <div className='h-4 w-64 animate-pulse rounded bg-gray-200 mt-2' />
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className='h-16 animate-pulse rounded bg-gray-200' />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const getTransactionBadge = (type: string) => {
    return type === 'credit' ? (
      <Badge
        variant='outline'
        className='bg-green-500/10 text-green-400 border-green-500/20'
      >
        + Credit
      </Badge>
    ) : (
      <Badge
        variant='outline'
        className='bg-red-500/10 text-red-400 border-red-500/20'
      >
        - Debit
      </Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      paid: 'bg-green-500/10 text-green-400 border-green-500/20',
      pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      failed: 'bg-red-500/10 text-red-400 border-red-500/20',
      refunded: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    }

    return (
      <Badge
        variant='outline'
        className={
          statusColors[status.toLowerCase()] ||
          'bg-slate-500/10 text-slate-400 border-slate-500/20'
        }
      >
        {status}
      </Badge>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Invoices */}
      {invoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <FileText className='w-5 h-5' />
              Invoices
            </CardTitle>
            <CardDescription>
              Download your payment receipts and invoices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className='flex items-center justify-between p-4 rounded-lg border hover:border-primary transition-all'
                >
                  <div className='flex items-center gap-4'>
                    <div className='w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center'>
                      <FileText className='w-5 h-5 text-primary' />
                    </div>
                    <div>
                      <div className='flex items-center gap-2 mb-1'>
                        <p className='font-semibold'>
                          ${(invoice.amount_paid / 100).toFixed(2)}
                        </p>
                        {getStatusBadge(invoice.status)}
                      </div>
                      <p className='text-sm text-muted-foreground'>
                        {formatDate(invoice.period_start)} -{' '}
                        {formatDate(invoice.period_end)}
                      </p>
                    </div>
                  </div>
                  {invoice.invoice_pdf && (
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => downloadInvoice(invoice.invoice_pdf!)}
                    >
                      <Download className='w-4 h-4 mr-2' />
                      Download
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <CreditCard className='w-5 h-5' />
            Transaction History
          </CardTitle>
          <CardDescription>
            Your recent credit transactions and usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className='text-center py-12'>
              <CreditCard className='w-12 h-12 mx-auto text-muted-foreground mb-4' />
              <p className='text-muted-foreground'>No transactions yet</p>
              <p className='text-sm text-muted-foreground mt-2'>
                Start using services to see your transaction history
              </p>
            </div>
          ) : (
            <div className='space-y-3'>
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className='flex items-center justify-between p-4 rounded-lg border'
                >
                  <div className='flex items-center gap-4 flex-1'>
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.type === 'credit'
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {transaction.type === 'credit' ? '+' : '-'}
                    </div>
                    <div className='flex-1'>
                      <div className='flex items-center gap-2 mb-1'>
                        <p className='font-semibold capitalize'>
                          {transaction.operation.replace(/_/g, ' ')}
                        </p>
                        {getTransactionBadge(transaction.type)}
                        {transaction.service_type && (
                          <Badge variant='outline' className='text-xs'>
                            {transaction.service_type}
                          </Badge>
                        )}
                      </div>
                      <p className='text-sm text-muted-foreground'>
                        {formatDate(transaction.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className='text-right'>
                    <p
                      className={`font-bold ${
                        transaction.type === 'credit'
                          ? 'text-green-600'
                          : 'text-gray-600'
                      }`}
                    >
                      {transaction.type === 'credit' ? '+' : '-'}
                      {transaction.amount} credits
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
