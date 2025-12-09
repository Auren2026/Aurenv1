import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle, XCircle, Ban, RotateCcw, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type CustomerStatus = 'pending' | 'approved' | 'inactive' | 'blocked';

interface Customer {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  address: string;
  nif: string | null;
  community: string;
  status: CustomerStatus;
  created_at: string;
  email?: string;
}

const Customers = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []) as Customer[];
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, newStatus }: { userId: string; newStatus: CustomerStatus }) => {
      const { error } = await supabase
        .from('customer_profiles')
        .update({ status: newStatus })
        .eq('user_id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success(t('customers.statusUpdated'));
    },
    onError: (error) => {
      toast.error(t('customers.errorUpdating'));
      console.error(error);
    }
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('customer_profiles')
        .delete()
        .eq('user_id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success(t('customers.customerDeleted'));
    },
    onError: (error) => {
      toast.error(t('customers.errorDeleting'));
      console.error(error);
    }
  });

  const getStatusBadge = (status: CustomerStatus) => {
    const variants = {
      pending: { label: t('customers.statusPending'), variant: 'secondary' as const },
      approved: { label: t('customers.statusApproved'), variant: 'default' as const },
      inactive: { label: t('customers.statusInactive'), variant: 'outline' as const },
      blocked: { label: t('customers.statusBlocked'), variant: 'destructive' as const }
    };
    const { label, variant } = variants[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

  const pendingCustomers = customers.filter(c => c.status === 'pending');
  const activeCustomers = customers.filter(c => c.status === 'approved');
  const inactiveCustomers = customers.filter(c => c.status === 'inactive' || c.status === 'blocked');

  const CustomerTable = ({ customers, actions }: { customers: Customer[]; actions: (customer: Customer) => JSX.Element }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('customers.business')}</TableHead>     
          <TableHead>{t('customers.email')}</TableHead>
          <TableHead>{t('common.name')}</TableHead>
          <TableHead>{t('customers.phone')}</TableHead>
          <TableHead>{t('customers.nif')}</TableHead>
          <TableHead>{t('customers.status')}</TableHead>
          <TableHead>{t('customers.actions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {customers.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center text-muted-foreground">
              {t('customers.noCustomersFound')}
            </TableCell>
          </TableRow>
        ) : (
          customers.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell className="font-medium">{customer.community}</TableCell>
              <TableCell>
                <div className="text-sm">{customer.email || '-'}</div>
              </TableCell>
              <TableCell>
                <div className="text-sm">{customer.full_name}</div>
              </TableCell>
              <TableCell>{customer.phone}</TableCell>
              <TableCell>{customer.nif || '-'}</TableCell>
              <TableCell>{getStatusBadge(customer.status)}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {actions(customer)}
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="bg-primary text-primary-foreground py-4 px-4 text-center">
        <h1 className="text-xl font-semibold">{t('customers.title')}</h1>
      </div>

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">
              {t('customers.pending')} ({pendingCustomers.length})
            </TabsTrigger>
            <TabsTrigger value="active">
              {t('customers.active')} ({activeCustomers.length})
            </TabsTrigger>
            <TabsTrigger value="inactive">
              {t('customers.inactiveBlocked')} ({inactiveCustomers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>{t('customers.pendingCustomers')}</CardTitle>
                <CardDescription>{t('customers.awaitingApproval')}</CardDescription>
              </CardHeader>
              <CardContent>
                <CustomerTable
                  customers={pendingCustomers}
                  actions={(customer) => (
                    <>
                      <Button
                        size="sm"
                        onClick={() => updateStatusMutation.mutate({ userId: customer.user_id, newStatus: 'approved' })}
                        disabled={updateStatusMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        {t('customers.approve')}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateStatusMutation.mutate({ userId: customer.user_id, newStatus: 'blocked' })}
                        disabled={updateStatusMutation.isPending}
                      >
                        <Ban className="h-4 w-4 mr-1" />
                        {t('customers.block')}
                      </Button>
                    </>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="active">
            <Card>
              <CardHeader>
                <CardTitle>{t('customers.activeCustomers')}</CardTitle>
                <CardDescription>{t('customers.fullAccess')}</CardDescription>
              </CardHeader>
              <CardContent>
                <CustomerTable
                  customers={activeCustomers}
                  actions={(customer) => (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatusMutation.mutate({ userId: customer.user_id, newStatus: 'inactive' })}
                        disabled={updateStatusMutation.isPending}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        {t('customers.deactivate')}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateStatusMutation.mutate({ userId: customer.user_id, newStatus: 'blocked' })}
                        disabled={updateStatusMutation.isPending}
                      >
                        <Ban className="h-4 w-4 mr-1" />
                        {t('customers.block')}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('customers.deleteCustomer')}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t('customers.deleteCustomerConfirm', { name: customer.full_name })}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteCustomerMutation.mutate(customer.user_id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {t('common.delete')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inactive">
            <Card>
              <CardHeader>
                <CardTitle>{t('customers.inactiveCustomers')}</CardTitle>
                <CardDescription>{t('customers.fullAccess')}</CardDescription>
              </CardHeader>
              <CardContent>
                <CustomerTable
                  customers={inactiveCustomers}
                  actions={(customer) => (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => updateStatusMutation.mutate({ userId: customer.user_id, newStatus: 'approved' })}
                      disabled={updateStatusMutation.isPending}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      {t('customers.reactivate')}
                    </Button>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Customers;
