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
import {
  Download,
  FileText,
  CreditCard,
  Calendar,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
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
      <Card className='border-border/50 bg-card/50 backdrop-blur-sm'>
        <CardHeader>
          <div className='h-7 w-40 animate-pulse rounded-lg bg-muted' />
          <div className='h-4 w-64 animate-pulse rounded bg-muted mt-3' />
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className='h-20 animate-pulse rounded-xl bg-muted' />
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
        className='bg-green-500/10 text-green-500 border-green-500/30 text-xs font-semibold'
      >
        + Credit
      </Badge>
    ) : (
      <Badge
        variant='outline'
        className='bg-red-500/10 text-red-500 border-red-500/30 text-xs font-semibold'
      >
        - Debit
      </Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      paid: 'bg-green-500/10 text-green-500 border-green-500/30',
      pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
      failed: 'bg-red-500/10 text-red-500 border-red-500/30',
      refunded: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
    }

    return (
      <Badge
        variant='outline'
        className={`text-xs font-semibold ${
          statusColors[status.toLowerCase()] ||
          'bg-slate-500/10 text-slate-400 border-slate-500/30'
        }`}
      >
        {status}
      </Badge>
    )
  }

  return (
    <div className='space-y-6 sm:space-y-8'>
      {/* Invoices */}
      {invoices.length > 0 && (
        <Card className='relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm'>
          <div className='absolute inset-0 bg-linear-to-br from-primary/5 to-transparent' />
          <CardHeader className='relative'>
            <CardTitle className='text-xl sm:text-2xl font-bold flex items-center gap-3'>
              <div className='p-2.5 rounded-xl bg-linear-to-br from-primary/20 to-primary/10 backdrop-blur-sm border border-primary/30'>
                <FileText className='w-5 h-5 text-primary' />
              </div>
              Invoices
            </CardTitle>
            <CardDescription className='text-sm'>
              Download your payment receipts and invoices
            </CardDescription>
          </CardHeader>
          <CardContent className='relative'>
            <div className='space-y-3'>
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className='group flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 sm:p-5 rounded-xl border border-border/50 bg-linear-to-br from-card to-muted/10 hover:border-primary/30 hover:shadow-lg transition-all duration-300'
                >
                  <div className='flex items-center gap-4'>
                    <div className='w-12 h-12 rounded-xl bg-linear-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/30 group-hover:scale-110 transition-transform'>
                      <FileText className='w-6 h-6 text-primary' />
                    </div>
                    <div>
                      <div className='flex items-center gap-2 mb-1.5 flex-wrap'>
                        <p className='text-xl font-bold bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent'>
                          ${(invoice.amount_paid / 100).toFixed(2)}
                        </p>
                        {getStatusBadge(invoice.status)}
                      </div>
                      <p className='text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5'>
                        <Calendar className='w-3 h-3' />
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
                      className='gap-2 hover:bg-primary/10 hover:border-primary/30 hover:scale-105 transition-all'
                    >
                      <Download className='w-4 h-4' />
                      <span className='hidden sm:inline'>Download</span>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction History */}
      <Card className='relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm'>
        <div className='absolute inset-0 bg-linear-to-br from-muted/20 to-transparent' />
        <CardHeader className='relative'>
          <CardTitle className='text-xl sm:text-2xl font-bold flex items-center gap-3'>
            <div className='p-2.5 rounded-xl bg-linear-to-br from-purple-500/20 to-purple-400/10 backdrop-blur-sm border border-purple-500/30'>
              <CreditCard className='w-5 h-5 text-purple-400' />
            </div>
            Transaction History
          </CardTitle>
          <CardDescription className='text-sm'>
            Your recent credit transactions and usage
          </CardDescription>
        </CardHeader>
        <CardContent className='relative'>
          {transactions.length === 0 ? (
            <div className='text-center py-12 sm:py-16'>
              <div className='relative inline-block'>
                <div className='absolute inset-0 bg-primary/20 blur-3xl' />
                <CreditCard className='relative w-16 h-16 sm:w-20 sm:h-20 mx-auto text-muted-foreground/50 mb-4' />
              </div>
              <p className='text-base font-medium text-muted-foreground'>
                No transactions yet
              </p>
              <p className='text-sm text-muted-foreground mt-2'>
                Start using services to see your transaction history
              </p>
            </div>
          ) : (
            <div className='space-y-3'>
              {transactions.map((transaction, index) => (
                <div
                  key={transaction.id}
                  className='group flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 sm:p-5 rounded-xl border border-border/50 bg-linear-to-br from-card to-muted/10 hover:border-primary/30 hover:shadow-lg transition-all duration-300'
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animation: 'fadeInUp 0.5s ease-out forwards',
                  }}
                >
                  <div className='flex items-center gap-4 flex-1'>
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center border group-hover:scale-110 transition-transform ${
                        transaction.type === 'credit'
                          ? 'bg-linear-to-br from-green-500/20 to-emerald-500/10 border-green-500/30 text-green-500'
                          : 'bg-linear-to-br from-muted to-muted/50 border-border text-muted-foreground'
                      }`}
                    >
                      {transaction.type === 'credit' ? (
                        <TrendingUp className='w-6 h-6' />
                      ) : (
                        <TrendingDown className='w-6 h-6' />
                      )}
                    </div>
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-2 mb-1.5 flex-wrap'>
                        <p className='font-semibold capitalize truncate'>
                          {transaction.operation.replace(/_/g, ' ')}
                        </p>
                        {getTransactionBadge(transaction.type)}
                        {transaction.service_type && (
                          <Badge
                            variant='outline'
                            className='text-xs bg-muted/50 border-border/50'
                          >
                            {transaction.service_type}
                          </Badge>
                        )}
                      </div>
                      <p className='text-xs sm:text-sm text-muted-foreground'>
                        {formatDate(transaction.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className='text-right sm:text-right'>
                    <p
                      className={`text-xl sm:text-2xl font-bold ${
                        transaction.type === 'credit'
                          ? 'text-green-500'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {transaction.type === 'credit' ? '+' : '-'}
                      {transaction.amount}
                    </p>
                    <p className='text-xs text-muted-foreground'>credits</p>
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
