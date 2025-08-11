import LoginForm from '@/components/auth/login-form';
import { Logo } from '@/components/icons/logo';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center justify-center gap-4 mb-8">
            <Logo className="h-16 w-16 text-primary" />
            <h1 className="text-3xl font-bold text-center tracking-tight text-foreground">TBConnect</h1>
            <p className="text-center text-muted-foreground">
                Your custom interface for ThingsBoard
            </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
