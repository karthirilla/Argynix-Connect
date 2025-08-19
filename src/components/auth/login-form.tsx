
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';

const loginSchema = z.object({
  username: z.string().min(1, { message: "Username is required." }),
  password: z.string().min(1, { message: "Password is required." }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

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

    if (!instanceUrl || instanceUrl === 'http://your-thingsboard-instance.com') {
      toast({
        variant: "destructive",
        title: "Configuration Error",
        description: "ThingsBoard instance URL is not configured. Please set it in your .env file.",
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
          throw new Error('Failed to fetch user details after login.');
      }
      
      const userData = await userResponse.json();
      
      localStorage.setItem('tb_instance_url', instanceUrl);
      localStorage.setItem('tb_auth_token', token);
      localStorage.setItem('tb_refresh_token', refreshToken);
      localStorage.setItem('tb_user', data.username);
      
      if (userData.customerId && userData.customerId.id && userData.customerId.id !== '13814000-1dd2-11b2-8080-808080808080') {
        localStorage.setItem('tb_customer_id', userData.customerId.id);
      } else {
        localStorage.removeItem('tb_customer_id');
      }

      toast({
        title: "Login Successful",
        description: "Redirecting to your dashboard...",
      });
      
      window.location.href = '/';

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
