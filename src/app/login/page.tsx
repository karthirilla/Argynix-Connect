import LoginForm from '@/components/auth/login-form';
import { Logo } from '@/components/icons/logo';
import Image from 'next/image';

export default function LoginPage() {
  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-screen">
      <div className="hidden bg-muted lg:block">
        <Image
          src="https://placehold.co/1080x1920.png"
          alt="IOT background"
          data-ai-hint="internet of things technology"
          width="1080"
          height="1920"
          className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
             <Logo className="mx-auto h-16 w-16 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Argynix-Connect</h1>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
