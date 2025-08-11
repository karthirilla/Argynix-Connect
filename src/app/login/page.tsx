import LoginForm from '@/components/auth/login-form';
import { Logo } from '@/components/icons/logo';
import Image from 'next/image';

export default function LoginPage() {
  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-screen">
      <div className="hidden bg-muted lg:block relative">
        <Image
          src="https://placehold.co/1920x1080.png"
          alt="IOT background"
          data-ai-hint="internet of things technology"
          layout="fill"
          objectFit="cover"
          className="opacity-20"
        />
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
                <Logo className="h-24 w-24 mx-auto text-primary" />
                <h1 className="mt-4 text-5xl font-bold tracking-tight text-foreground">
                    Welcome to Argynix IOT
                </h1>
                <p className="mt-2 text-lg text-muted-foreground">
                    The future of IoT, today.
                </p>
            </div>
        </div>
      </div>
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
           <div className="grid gap-2 text-center lg:hidden">
            <Logo className="h-16 w-16 text-primary mx-auto" />
            <h1 className="text-3xl font-bold text-foreground">Argynix IOT</h1>
            <p className="text-balance text-muted-foreground">
              Enter your Argynix instance details to connect
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
