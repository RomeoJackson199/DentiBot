import React, { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMediaQuery } from "@/hooks/use-media-query";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  CreditCard,
  DollarSign,
  FileText,
  Download,
  Eye,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Calendar,
  Receipt,
  Loader2,
  BarChart3,
  PieChart,
  Activity
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

interface PaymentsPageProps {
  user: User;
}

interface PaymentRequest {
  id: string;
  amount: number;
  description: string;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  created_at: string;
  paid_at?: string;
  due_date?: string;
  invoice_url?: string;
  payment_method?: string;
  appointment_id?: string;
  appointment?: {
    service_type: string;
    appointment_date: string;
  };
}

interface PaymentAnalytics {
  totalSpent: number;
  averagePerVisit: number;
  monthlySpend: Array<{ month: string; amount: number }>;
  spendByCategory: Array<{ category: string; amount: number; percentage: number }>;
  paymentTrends: 'increasing' | 'decreasing' | 'stable';
}

export const PaymentsPage: React.FC<PaymentsPageProps> = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("history");
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [pendingPayments, setPendingPayments] = useState<PaymentRequest[]>([]);
  const [analytics, setAnalytics] = useState<PaymentAnalytics | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRequest | null>(null);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  
  const { toast } = useToast();
  const isMobile = useMediaQuery("(max-width: 599px)");

  useEffect(() => {
    fetchPaymentData();
  }, [user.id]);

  const fetchPaymentData = async () => {
    try {
      setLoading(true);
      
      // Fetch payment requests
      const { data: paymentData, error } = await supabase
        .from('payment_requests')
        .select(`
          *,
          appointment:appointments(
            service_type,
            appointment_date
          )
        `)
        .eq('patient_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (paymentData) {
        const pending = paymentData.filter(p => p.status === 'pending');
        const allPayments = paymentData;
        
        setPendingPayments(pending);
        setPayments(allPayments);
        
        // Calculate analytics
        calculateAnalytics(allPayments);
      }

    } catch (error) {
      console.error('Error fetching payment data:', error);
      toast({
        title: "Error",
        description: "Failed to load payment data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (paymentData: PaymentRequest[]) => {
    const paidPayments = paymentData.filter(p => p.status === 'paid');
    
    // Total spent
    const totalSpent = paidPayments.reduce((sum, p) => sum + p.amount, 0);
    
    // Average per visit
    const averagePerVisit = paidPayments.length > 0 ? totalSpent / paidPayments.length : 0;
    
    // Monthly spend (last 12 months)
    const monthlyData: { [key: string]: number } = {};
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const month = subMonths(now, i);
      const monthKey = format(month, 'MMM yyyy');
      monthlyData[monthKey] = 0;
    }
    
    paidPayments.forEach(payment => {
      const paymentDate = new Date(payment.paid_at || payment.created_at);
      const monthKey = format(paymentDate, 'MMM yyyy');
      if (monthlyData.hasOwnProperty(monthKey)) {
        monthlyData[monthKey] += payment.amount;
      }
    });
    
    const monthlySpend = Object.entries(monthlyData).map(([month, amount]) => ({
      month,
      amount
    }));
    
    // Spend by category
    const categoryData: { [key: string]: number } = {};
    paidPayments.forEach(payment => {
      const category = payment.appointment?.service_type || payment.description || 'Other';
      categoryData[category] = (categoryData[category] || 0) + payment.amount;
    });
    
    const spendByCategory = Object.entries(categoryData).map(([category, amount]) => ({
      category,
      amount,
      percentage: (amount / totalSpent) * 100
    })).sort((a, b) => b.amount - a.amount);
    
    // Payment trends
    const recentMonths = monthlySpend.slice(-3);
    const trend = recentMonths[2]?.amount > recentMonths[0]?.amount ? 'increasing' :
                  recentMonths[2]?.amount < recentMonths[0]?.amount ? 'decreasing' : 'stable';
    
    setAnalytics({
      totalSpent,
      averagePerVisit,
      monthlySpend,
      spendByCategory,
      paymentTrends: trend
    });
  };

  const handlePayNow = async (paymentId: string) => {
    try {
      setProcessingPayment(paymentId);
      
      // In production, this would integrate with Stripe
      // For now, we'll simulate a payment
      const { error } = await supabase
        .from('payment_requests')
        .update({ 
          status: 'paid',
          paid_at: new Date().toISOString(),
          payment_method: 'card'
        })
        .eq('id', paymentId);

      if (error) throw error;

      toast({
        title: "Payment Successful",
        description: "Your payment has been processed successfully.",
      });

      // Refresh data
      fetchPaymentData();
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingPayment(null);
    }
  };

  const handlePayAll = async () => {
    try {
      setProcessingPayment('all');
      
      // Process all pending payments
      const paymentPromises = pendingPayments.map(payment =>
        supabase
          .from('payment_requests')
          .update({ 
            status: 'paid',
            paid_at: new Date().toISOString(),
            payment_method: 'card'
          })
          .eq('id', payment.id)
      );

      await Promise.all(paymentPromises);

      toast({
        title: "All Payments Successful",
        description: `${pendingPayments.length} payment(s) have been processed successfully.`,
      });

      // Refresh data
      fetchPaymentData();
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: "There was an error processing your payments. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingPayment(null);
    }
  };

  const handleViewInvoice = (payment: PaymentRequest) => {
    setSelectedPayment(payment);
    setShowInvoiceDialog(true);
  };

  const handleDownloadInvoice = (payment: PaymentRequest) => {
    // In production, this would generate and download a PDF invoice
    toast({
      title: "Invoice Downloaded",
      description: `Invoice for ${payment.description} has been downloaded.`,
    });
  };

  const totalDue = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-10 w-full" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Payments</h1>
        <p className="text-muted-foreground">Manage your payment history and billing</p>
      </div>

      {/* Outstanding Balance */}
      {totalDue > 0 && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Outstanding Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-3xl font-bold">${totalDue.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">
                  {pendingPayments.length} pending payment{pendingPayments.length !== 1 ? 's' : ''}
                </p>
              </div>
              <Button 
                onClick={handlePayAll}
                disabled={processingPayment === 'all'}
              >
                {processingPayment === 'all' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay All
                  </>
                )}
              </Button>
            </div>
            
            <div className="space-y-2">
              {pendingPayments.slice(0, 3).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{payment.description}</p>
                    <p className="text-xs text-muted-foreground">
                      Due {payment.due_date ? format(new Date(payment.due_date), 'MMM d, yyyy') : 'now'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">${payment.amount.toFixed(2)}</span>
                    <Button 
                      size="sm"
                      onClick={() => handlePayNow(payment.id)}
                      disabled={processingPayment === payment.id}
                    >
                      {processingPayment === payment.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Pay'
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Outstanding Balance */}
      {totalDue === 0 && (
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">You're all set!</p>
                <p className="text-sm text-green-700">No outstanding payments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="history">Payment History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Payment History */}
        <TabsContent value="history" className="space-y-4">
          {payments.length > 0 ? (
            payments.map((payment) => (
              <Card key={payment.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">{payment.description}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(payment.created_at), 'MMM d, yyyy')}
                        </span>
                        {payment.appointment && (
                          <span>{payment.appointment.service_type}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-semibold text-lg">${payment.amount.toFixed(2)}</p>
                      <Badge variant={
                        payment.status === 'paid' ? 'secondary' :
                        payment.status === 'pending' ? 'default' :
                        payment.status === 'failed' ? 'destructive' :
                        'outline'
                      }>
                        {payment.status === 'paid' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {payment.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-3">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleViewInvoice(payment)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Invoice
                    </Button>
                    {payment.status === 'paid' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDownloadInvoice(payment)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    )}
                    {payment.status === 'pending' && (
                      <Button 
                        size="sm"
                        onClick={() => handlePayNow(payment.id)}
                        disabled={processingPayment === payment.id}
                      >
                        {processingPayment === payment.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CreditCard className="h-4 w-4 mr-1" />
                            Pay Now
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Receipt className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">No payment history yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-6">
          {analytics && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Spent
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">${analytics.totalSpent.toFixed(2)}</p>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      {analytics.paymentTrends === 'increasing' && (
                        <>
                          <TrendingUp className="h-3 w-3 text-red-600" />
                          <span>Increasing</span>
                        </>
                      )}
                      {analytics.paymentTrends === 'decreasing' && (
                        <>
                          <TrendingDown className="h-3 w-3 text-green-600" />
                          <span>Decreasing</span>
                        </>
                      )}
                      {analytics.paymentTrends === 'stable' && (
                        <>
                          <Activity className="h-3 w-3 text-blue-600" />
                          <span>Stable</span>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Average Per Visit
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">${analytics.averagePerVisit.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Per appointment
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Visits
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">
                      {payments.filter(p => p.status === 'paid').length}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Completed payments
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Monthly Spend Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Monthly Spending
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={analytics.monthlySpend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 12 }}
                        angle={isMobile ? -45 : 0}
                        textAnchor={isMobile ? "end" : "middle"}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        formatter={(value: number) => `$${value.toFixed(2)}`}
                      />
                      <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Spend by Category */}
              {analytics.spendByCategory.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5" />
                      Spending by Service
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <RePieChart>
                        <Pie
                          data={analytics.spendByCategory}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ category, percentage }) => 
                            `${category} (${percentage.toFixed(0)}%)`
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="amount"
                        >
                          {analytics.spendByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                      </RePieChart>
                    </ResponsiveContainer>
                    
                    <div className="mt-4 space-y-2">
                      {analytics.spendByCategory.map((category, index) => (
                        <div key={category.category} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span>{category.category}</span>
                          </div>
                          <span className="font-medium">${category.amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Invoice Dialog */}
      <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <DialogContent className={cn("max-w-2xl", isMobile && "w-full")}>
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
            <DialogDescription>
              Invoice #{selectedPayment?.id.slice(0, 8).toUpperCase()}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {format(new Date(selectedPayment.created_at), 'MMMM d, yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={
                    selectedPayment.status === 'paid' ? 'secondary' :
                    selectedPayment.status === 'pending' ? 'default' :
                    'destructive'
                  }>
                    {selectedPayment.status}
                  </Badge>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground mb-2">Services</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>{selectedPayment.description}</span>
                    <span className="font-medium">${selectedPayment.amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>${selectedPayment.amount.toFixed(2)}</span>
                </div>
              </div>
              
              {selectedPayment.status === 'paid' && selectedPayment.paid_at && (
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground">Payment Information</p>
                  <div className="mt-2 space-y-1 text-sm">
                    <p>Paid on: {format(new Date(selectedPayment.paid_at), 'MMMM d, yyyy')}</p>
                    <p>Method: {selectedPayment.payment_method || 'Card'}</p>
                  </div>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => handleDownloadInvoice(selectedPayment)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                {selectedPayment.status === 'pending' && (
                  <Button onClick={() => {
                    handlePayNow(selectedPayment.id);
                    setShowInvoiceDialog(false);
                  }}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay Now
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};