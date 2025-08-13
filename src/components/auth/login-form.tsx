
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Skeleton } from '../ui/skeleton';

const loginSchema = z.object({
  username: z.string().min(1, { message: "Username is required." }),
  password: z.string().min(1, { message: "Password is required." }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginFormBody() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true);


  useEffect(() => {
    // If user is already logged in, redirect them to the dashboard root
    const token = localStorage.getItem('tb_auth_token');
    if (token) {
      router.replace('/home');
    } else {
      setIsAuthenticating(false);
    }
  }, [router]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    const instanceUrl = process.env.NEXT_PUBLIC_THINGSBOARD_INSTANCE_URL;

    if (!instanceUrl) {
      toast({
        variant: "destructive",
        title: "Configuration Error",
        description: "ThingsBoard instance URL is not configured.",
      });
      setIsLoading(false);
      return;
    }

    try {
      const loginResponse = await fetch(`${instanceUrl}/api/auth/login`, {
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
      
      const userResponse = await fetch(`${instanceUrl}/api/auth/user`, {
          headers: {
              'X-Authorization': `Bearer ${token}`
          }
      });

      if (!userResponse.ok) {
          throw new Error('Failed to fetch user details');
      }
      
      const userData = await userResponse.json();
      
      localStorage.setItem('tb_instance_url', instanceUrl);
      localStorage.setItem('tb_auth_token', token);
      localStorage.setItem('tb_refresh_token', refreshToken);
      localStorage.setItem('tb_user', data.username);
      
      // A customerId is required for most data fetching operations.
      // The API returns a "generic" customerId for tenant admins.
      if (userData.customerId && userData.customerId.id && userData.customerId.id !== '13814000-1dd2-11b2-8080-808080808080') {
        localStorage.setItem('tb_customer_id', userData.customerId.id);
      } else {
        localStorage.removeItem('tb_customer_id');
      }

      toast({
        title: "Login Successful",
        description: "Redirecting to your dashboard...",
      });
      router.push('/home');

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
  
  if (isAuthenticating) {
    return (
        <div className="space-y-4">
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
    );
  }

  return (
     <div className="grid gap-6">
        <Form {...form}>
            <form 
                onSubmit={form.handleSubmit(onSubmit)} 
                className="grid gap-4"
            >
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
            <div>
                <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Connect
                </Button>
            </div>
            </form>
        </Form>
     </div>
  )
}

export default function LoginForm() {
  return <LoginFormBody />;
}
