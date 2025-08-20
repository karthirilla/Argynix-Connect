
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '../ui/dialog';
import { requestPasswordReset } from '@/lib/api';

const loginSchema = z.object({
  username: z.string().email({ message: "Please enter a valid email address." }).min(1, { message: "Username is required." }),
  password: z.string().min(1, { message: "Password is required." }),
});

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});


type LoginFormValues = z.infer<typeof loginSchema>;
type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function LoginForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPasswordLoading, setIsForgotPasswordLoading] = useState(false);
  const [isForgotPassDialogOpen, setIsForgotPassDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const forgotPasswordForm = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onLoginSubmit = async (data: LoginFormValues) => {
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
          'Accept': 'application/json',
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
          throw new Error('Login successful, but failed to fetch user details.');
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
            title: "Login Failed",
            description: error.message || "Could not connect to the ThingsBoard instance. Please check the URL and your connection.",
        });
    } finally {
        setIsLoading(false);
    }
  };

  const onForgotPasswordSubmit = async (data: ForgotPasswordFormValues) => {
    setIsForgotPasswordLoading(true);
    const instanceUrl = process.env.NEXT_PUBLIC_THINGSBOARD_INSTANCE_URL;

     if (!instanceUrl || instanceUrl === 'http://your-thingsboard-instance.com') {
      toast({
        variant: "destructive",
        title: "Configuration Error",
        description: "ThingsBoard instance URL is not configured.",
      });
      setIsForgotPasswordLoading(false);
      return;
    }

    try {
        await requestPasswordReset(instanceUrl, data.email);

        // ThingsBoard API returns 200 OK regardless of whether email exists for security reasons
        toast({
            title: 'Request Sent',
            description: 'If an account with that email exists, a password reset link has been sent.',
        });
        setIsForgotPassDialogOpen(false); // Close dialog on success

    } catch (error: any) {
         toast({
            variant: "destructive",
            title: "Request Failed",
            description: "Could not send reset link. Please check the connection and try again.",
        });
    } finally {
        setIsForgotPasswordLoading(false);
    }
  }
  
  return (
     <div className="grid gap-6">
        <Form {...loginForm}>
            <form 
                onSubmit={loginForm.handleSubmit(onLoginSubmit)} 
                className="grid gap-4"
            >
                <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                                <Input placeholder="your-email@example.com" {...field} autoComplete="username" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Password</FormLabel>
                             <div className="relative">
                                <FormControl>
                                    <Input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        {...field}
                                        autoComplete="current-password"
                                        className="pr-10"
                                    />
                                </FormControl>
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? <EyeOff /> : <Eye />}
                                </button>
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                
                <div className="text-right">
                    <Dialog open={isForgotPassDialogOpen} onOpenChange={setIsForgotPassDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="link" size="sm" type="button" className="text-sm font-medium px-0">
                                Forgot Password?
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Reset Your Password</DialogTitle>
                                <DialogDescription>
                                    Enter your account's email address and we will send you a password reset link.
                                </DialogDescription>
                            </DialogHeader>
                            <Form {...forgotPasswordForm}>
                                <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)} className="space-y-4">
                                     <FormField
                                        control={forgotPasswordForm.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="your-email@example.com" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                     <DialogFooter>
                                        <DialogClose asChild>
                                            <Button type="button" variant="outline">Cancel</Button>
                                        </DialogClose>
                                        <Button type="submit" disabled={isForgotPasswordLoading}>
                                            {isForgotPasswordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Send Reset Link
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>
                
                <div className="mt-2">
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Connect
                    </Button>
                </div>
            </form>
        </Form>
     </div>
  )
}
