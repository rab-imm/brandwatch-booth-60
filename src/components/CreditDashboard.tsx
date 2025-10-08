import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { IconCoins, IconTrendingDown, IconCalendar, IconShoppingCart } from "@tabler/icons-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export const CreditDashboard = () => {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    const { data } = await supabase
      .from('credit_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
    
    setTransactions(data || [])
  }

  const handlePurchaseCredits = async (amount: number) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('purchase-credits', {
        body: { credits_amount: amount }
      })

      if (error) throw error

      toast({
        title: "Purchase Initiated",
        description: `Purchasing ${amount} credits. Redirecting to payment...`,
      })

      // Here you would redirect to Stripe Checkout
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getTransactionBadge = (type: string) => {
    const variants: any = {
      'allocation': 'default',
      'usage': 'destructive',
      'purchase': 'secondary',
      'rollover': 'outline',
      'gift': 'secondary'
    }
    return <Badge variant={variants[type] || 'default'}>{type}</Badge>
  }

  const creditsRemaining = profile?.queries_remaining || 0
  const tierLimits: { [key: string]: number } = {
    'free': 50,
    'basic': 500,
    'professional': 2000,
    'enterprise': 10000
  }
  const maxCredits = tierLimits[profile?.subscription_tier || 'free'] || 50
  const usagePercentage = ((maxCredits - creditsRemaining) / maxCredits) * 100

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Credits Remaining</CardTitle>
            <IconCoins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{creditsRemaining}</div>
            <Progress value={100 - usagePercentage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {creditsRemaining} of {maxCredits} credits remaining
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Usage This Month</CardTitle>
            <IconTrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{maxCredits - creditsRemaining}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {usagePercentage.toFixed(1)}% of monthly allowance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Next Renewal</CardTitle>
            <IconCalendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Monthly credits reset
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Purchase Additional Credits</CardTitle>
          <CardDescription>
            Need more credits? Purchase add-on credits that never expire.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {[100, 500, 1000].map((amount) => (
              <Button
                key={amount}
                variant="outline"
                onClick={() => handlePurchaseCredits(amount)}
                disabled={loading}
              >
                <IconShoppingCart className="h-4 w-4 mr-2" />
                {amount} Credits - {amount} AED
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Your recent credit transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Feature</TableHead>
                <TableHead className="text-right">Balance After</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{new Date(transaction.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{getTransactionBadge(transaction.transaction_type)}</TableCell>
                  <TableCell className={transaction.credits_amount > 0 ? "text-green-600" : "text-red-600"}>
                    {transaction.credits_amount > 0 ? '+' : ''}{transaction.credits_amount}
                  </TableCell>
                  <TableCell>{transaction.feature_used || '-'}</TableCell>
                  <TableCell className="text-right">{transaction.balance_after}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}