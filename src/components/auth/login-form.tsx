
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Skeleton } from '../ui/skeleton';

const loginSchema = z.object({
  instanceUrl: z.string().url({ message: "Please enter a valid URL (e.g., https://thingsboard.example.com)." }),
  username: z.string().min(1, { message: "Username is required." }),
  password: z.string().min(1, { message: "Password is required." }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginFormBody() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      instanceUrl: '',
      username: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const loginResponse = await fetch(`${data.instanceUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: data.username,
          password: data.password,
        }),
      });

      if (!loginResponse.ok) {
        const errorData = await loginResponse.json();
        throw new Error(errorData.message || "Invalid username or password. Please try again.");
      }
      
      const { token, refreshToken } = await loginResponse.json();
      
      const userResponse = await fetch(`${data.instanceUrl}/api/auth/user`, {
          headers: {
              'X-Authorization': `Bearer ${token}`
          }
      });

      if (!userResponse.ok) {
          throw new Error('Failed to fetch user details');
      }
      
      const userData = await userResponse.json();
      
      localStorage.setItem('tb_instance_url', data.instanceUrl);
      localStorage.setItem('tb_auth_token', token);
      localStorage.setItem('tb_refresh_token', refreshToken);
      localStorage.setItem('tb_user', data.username);

      if (userData.customerId && userData.customerId.id) {
        localStorage.setItem('tb_customer_id', userData.customerId.id);
      } else {
        localStorage.removeItem('tb_customer_id');
      }

      toast({
        title: "Login Successful",
        description: "Redirecting to your dashboard...",
      });
      router.push('/dashboard');

    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Error",
            description: error.message || "Could not connect to the ThingsBoard instance. Please check the URL and your connection.",
        });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="instanceUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Instance URL</FormLabel>
              <FormControl>
                <Input placeholder="https://thingsboard.example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="your-email@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Connect
        </Button>
      </form>
    </Form>
  )
}

export default function LoginForm() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);


  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Connect to ThingsBoard</CardTitle>
        <CardDescription>Enter your instance details to get started.</CardDescription>
      </CardHeader>
      <CardContent>
        {!isMounted ? (
           <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-10 w-full" />
              </div>
                <Skeleton className="h-10 w-full" />
           </div>
        ) : (
          <LoginFormBody />
        )}
      </CardContent>
    </Card>
  );
}
