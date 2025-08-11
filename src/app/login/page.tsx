import LoginForm from '@/components/auth/login-form';
import { Logo } from '@/components/icons/logo';
import Image from 'next/image';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center p-4">
      <Image
        src="https://placehold.co/1920x1080.png"
        alt="IOT background"
        data-ai-hint="internet of things technology"
        layout="fill"
        objectFit="cover"
        className="absolute inset-0 z-0 opacity-20"
      />
      <Card className="relative z-10 w-full max-w-md shadow-2xl">
        <CardHeader>
           <div className="mx-auto grid w-full gap-2 text-center">
            <Logo className="mx-auto h-16 w-16 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Argynix IOT</h1>
            <p className="text-balance text-muted-foreground">
              Enter your Argynix instance details to connect
            </p>
          </div>
        </CardHeader>
        <CardContent>
           <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
