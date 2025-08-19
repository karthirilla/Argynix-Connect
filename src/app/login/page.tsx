import LoginForm from '@/components/auth/login-form';
import { Logo } from '@/components/icons/logo';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm mx-auto flex flex-col items-center justify-center gap-6">
          <div className="grid gap-4 text-center animate-in fade-in-50 zoom-in-95 duration-500">
             <Logo className="mx-auto h-16 w-16 text-primary" />
             <div>
                <h1 className="text-3xl font-bold text-foreground">Argynix-Connect</h1>
             </div>
          </div>
          <div className="w-full animate-in fade-in-50 zoom-in-95 duration-500 delay-200">
            <LoginForm />
          </div>
        </div>
    </div>
  );
}
