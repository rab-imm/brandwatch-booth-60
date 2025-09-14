import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Icon } from "@/components/ui/Icon"
import { toast } from "sonner"

interface BillingTransaction {
  id: string
  amount_aed: number
  currency: string
  status: string
  description: string
  created_at: string
  stripe_invoice_id?: string
  transaction_type: string
}

interface PersonalBillingHistoryProps {
  onBackToSubscription: () => void
}

export const PersonalBillingHistory = ({ onBackToSubscription }: PersonalBillingHistoryProps) => {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<BillingTransaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchBillingHistory()
    }
  }, [user])

  const fetchBillingHistory = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('billing_transactions')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTransactions(data || [])
    } catch (error) {
      console.error('Error fetching billing history:', error)
      toast.error('Failed to load billing history')
    } finally {
      setLoading(false)
    }
  }

  const downloadInvoice = async (invoiceId: string) => {
    try {
      // In a real implementation, this would call a Stripe function to get the invoice PDF
      toast.success('Invoice download feature coming soon')
    } catch (error) {
      console.error('Error downloading invoice:', error)
      toast.error('Failed to download invoice')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return 'credit-card'
      case 'refund':
        return 'arrow-left'
      case 'adjustment':
        return 'edit'
      default:
        return 'circle'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Icon name="loader" className="h-8 w-8 animate-spin mr-2" />
        <span>Loading billing history...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBackToSubscription}>
          <Icon name="arrow-left" className="h-4 w-4 mr-2" />
          Back to Subscription
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Billing History</h2>
          <p className="text-muted-foreground">View your payment history and download invoices</p>
        </div>
      </div>

      {/* Billing Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              AED {transactions
                .filter(t => t.status === 'succeeded' && t.transaction_type === 'payment')
                .reduce((sum, t) => sum + Number(t.amount_aed), 0)
                .toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">All time payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              AED {transactions
                .filter(t => {
                  const isCurrentMonth = new Date(t.created_at).getMonth() === new Date().getMonth()
                  return t.status === 'succeeded' && t.transaction_type === 'payment' && isCurrentMonth
                })
                .reduce((sum, t) => sum + Number(t.amount_aed), 0)
                .toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Current month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Failed Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {transactions.filter(t => t.status === 'failed').length}
            </div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>All your billing transactions and payments</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-muted">
                      <Icon 
                        name={getTransactionIcon(transaction.transaction_type)} 
                        className="h-4 w-4" 
                      />
                    </div>
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(transaction.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold">
                        {transaction.transaction_type === 'refund' ? '-' : ''}
                        {transaction.currency || 'AED'} {Number(transaction.amount_aed || 0).toFixed(2)}
                      </p>
                      <Badge className={getStatusColor(transaction.status)}>
                        {transaction.status}
                      </Badge>
                    </div>
                    
                    {transaction.stripe_invoice_id && transaction.status === 'succeeded' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadInvoice(transaction.stripe_invoice_id!)}
                      >
                        <Icon name="download" className="h-4 w-4 mr-2" />
                        Invoice
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Icon name="receipt" className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No billing transactions found</p>
              <p className="text-sm text-muted-foreground">Your payment history will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Issues Alert */}
      {transactions.some(t => t.status === 'failed') && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Icon name="alert-circle" className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-800">Payment Issues Detected</p>
                <p className="text-sm text-red-700">
                  You have failed payments that may require updating your payment method.
                </p>
                <Button variant="outline" size="sm" className="mt-2" onClick={() => toast.info('Redirecting to payment management...')}>
                  Update Payment Method
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}