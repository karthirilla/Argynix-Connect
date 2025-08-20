
// /app/(dashboard)/customers/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { getCustomers, saveCustomer, deleteCustomer, getUser } from '@/lib/api';
import type { ThingsboardCustomer, ThingsboardUser } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Building, Trash2, PlusCircle, Edit, UserCog } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
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
} from "@/components/ui/alert-dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const customerFormSchema = z.object({
  title: z.string().min(1, { message: "Customer title is required." }),
  email: z.string().email({ message: "Please enter a valid email." }).optional().or(z.literal('')),
  phone: z.string().optional(),
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  zip: z.string().optional(),
  additionalInfo: z.string().optional(),
});
type CustomerFormValues = z.infer<typeof customerFormSchema>;

function CustomerFormDialog({ customer, onSave, currentUser }: { customer?: ThingsboardCustomer, onSave: () => void, currentUser: ThingsboardUser | null }) {
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    
    const form = useForm<CustomerFormValues>({
        resolver: zodResolver(customerFormSchema),
    });

     useEffect(() => {
        if (isOpen) {
            form.reset({
                title: customer?.title || '',
                email: customer?.email || '',
                phone: customer?.phone || '',
                country: customer?.country || '',
                state: customer?.state || '',
                city: customer?.city || '',
                address: customer?.address || '',
                zip: customer?.zip || '',
                additionalInfo: typeof customer?.additionalInfo === 'string' ? customer.additionalInfo : customer?.additionalInfo?.description || ''
            });
        }
    }, [isOpen, customer, form]);

    const onSubmit = async (data: CustomerFormValues) => {
        const token = localStorage.getItem('tb_auth_token');
        const instanceUrl = localStorage.getItem('tb_instance_url');
        if (!token || !instanceUrl || !currentUser) return;
        
        setIsSaving(true);
        try {
            const customerToSave: Partial<ThingsboardCustomer> = {
                id: customer?.id,
                tenantId: currentUser.tenantId,
                title: data.title,
                email: data.email,
                phone: data.phone,
                country: data.country,
                state: data.state,
                city: data.city,
                address: data.address,
                zip: data.zip,
                additionalInfo: { description: data.additionalInfo },
            }

            await saveCustomer(token, instanceUrl, customerToSave);
            
            toast({ title: "Success", description: `Customer "${data.title}" has been saved.` });
            onSave();
            setIsOpen(false);
        } catch (e: any) {
             toast({ variant: 'destructive', title: 'Failed to save customer', description: e.message });
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {customer ? (
                     <Button variant="outline" size="sm"><Edit className="mr-2 h-4 w-4" /> Edit</Button>
                ) : (
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Customer
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
                 <DialogHeader>
                    <DialogTitle>{customer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
                    <DialogDescription>
                        {customer ? `Editing details for ${customer.title}.` : 'Create a new customer to organize users and devices.'}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-4">
                        <FormField control={form.control} name="title" render={({ field }) => (
                            <FormItem><FormLabel>Customer Title</FormLabel><FormControl><Input placeholder="e.g., Building A" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <div className="grid grid-cols-2 gap-4">
                             <FormField control={form.control} name="email" render={({ field }) => (
                                <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="contact@customer.com" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="phone" render={({ field }) => (
                                <FormItem><FormLabel>Phone</FormLabel><FormControl><Input placeholder="+1 234 567 890" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                        </div>
                        <FormField control={form.control} name="address" render={({ field }) => (
                            <FormItem><FormLabel>Street Address</FormLabel><FormControl><Input placeholder="123 Main St" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                         <div className="grid grid-cols-2 gap-4">
                             <FormField control={form.control} name="city" render={({ field }) => (
                                <FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="New York" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="state" render={({ field }) => (
                                <FormItem><FormLabel>State / Province</FormLabel><FormControl><Input placeholder="NY" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                             <FormField control={form.control} name="zip" render={({ field }) => (
                                <FormItem><FormLabel>Zip / Postal Code</FormLabel><FormControl><Input placeholder="10001" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="country" render={({ field }) => (
                                <FormItem><FormLabel>Country</FormLabel><FormControl><Input placeholder="USA" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                        </div>
                        <FormField control={form.control} name="additionalInfo" render={({ field }) => (
                            <FormItem><FormLabel>Additional Info / Description</FormLabel><FormControl><Textarea placeholder="Any other relevant details." {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        
                        <DialogFooter className="sticky bottom-0 bg-background pt-4">
                            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <PlusCircle className="mr-2 h-4 w-4" />}
                                Save Customer
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export default function CustomersPage() {
    const [customers, setCustomers] = useState<ThingsboardCustomer[]>([]);
    const [currentUser, setCurrentUser] = useState<ThingsboardUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchCustomers = async () => {
        setIsLoading(true);
        setError(null);
        const token = localStorage.getItem('tb_auth_token');
        const instanceUrl = localStorage.getItem('tb_instance_url');

        if (!token || !instanceUrl) {
            setError('Authentication details not found.');
            setIsLoading(false);
            return;
        }

        try {
            const currentUserData = await getUser(token, instanceUrl);
            setCurrentUser(currentUserData);
            
            // This page is only for Tenant Admins.
            if (currentUserData.authority !== 'TENANT_ADMIN') {
                 setIsLoading(false);
                 return;
            }

            const customersData = await getCustomers(token, instanceUrl);
            // Filter out the "Public" customer as it's not a real manageable entity
            setCustomers(customersData.filter(c => c.id.id !== '13814000-1dd2-11b2-8080-808080808080'));

        } catch (e: any) {
            setError(e.message || 'Failed to fetch customers.');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const handleDeleteCustomer = async (customerId: string) => {
        const token = localStorage.getItem('tb_auth_token');
        const instanceUrl = localStorage.getItem('tb_instance_url');
        if (!token || !instanceUrl) return;

        try {
            await deleteCustomer(token, instanceUrl, customerId);
            toast({ title: 'Success', description: 'Customer has been deleted.' });
            await fetchCustomers(); // Refresh list
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Delete Failed', description: e.message || 'Could not delete customer.' });
        }
    }

    if (isLoading) {
        return (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                        </CardContent>
                        <CardFooter className="flex justify-end gap-2">
                            <Skeleton className="h-9 w-24" />
                            <Skeleton className="h-9 w-24" />
                        </CardFooter>
                    </Card>
                ))}
            </div>
        );
    }
    
    if(error) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    if (currentUser?.authority !== 'TENANT_ADMIN') {
        return (
             <div className="container mx-auto px-0 md:px-4">
                <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg">
                    <UserCog className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-2xl font-semibold">Permission Denied</h3>
                    <p className="text-muted-foreground text-center max-w-md mt-2">
                        You do not have sufficient permissions to manage Customers. This page is available only to Tenant Administrators.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                 <div>
                    <h1 className="text-2xl font-bold tracking-tight">Customer Management</h1>
                    <p className="text-muted-foreground">Organize your users and devices by customer.</p>
                </div>
                 <CustomerFormDialog onSave={fetchCustomers} currentUser={currentUser}/>
            </div>
            {customers.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {customers.map(customer => (
                        <Card key={customer.id.id} className="flex flex-col">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3 text-lg">
                                <Building className="h-5 w-5 text-muted-foreground"/> {customer.title}
                                </CardTitle>
                                <CardDescription>
                                    {customer.email || 'No email provided'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm flex-grow">
                                {customer.city && <div><strong>Location:</strong> {customer.city}, {customer.country}</div>}
                                {customer.phone && <div><strong>Phone:</strong> {customer.phone}</div>}
                            </CardContent>
                             <CardFooter className="flex justify-end gap-2">
                                <CustomerFormDialog customer={customer} onSave={fetchCustomers} currentUser={currentUser}/>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4" /> Delete</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete the customer <span className="font-bold">{customer.title}</span> and all related data.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteCustomer(customer.id.id)}>Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg">
                    <Building className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-2xl font-semibold">No Customers Found</h3>
                    <p className="text-muted-foreground text-center max-w-md mt-2">
                        Click "Add Customer" to create your first customer.
                    </p>
                </div>
            )}
        </div>
    );
}

    
