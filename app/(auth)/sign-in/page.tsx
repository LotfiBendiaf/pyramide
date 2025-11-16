"use client";

import LoginForm from "@/components/forms/login-form";
import Logo from "@/components/Logo";
import SlideIn from "@/components/SlideInWrapper";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { signInWithCredentials } from "@/lib/actions/auth.action";
import { SignInSchema } from "@/lib/validators/auth";
import Image from "next/image";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-svh bg-cover bg-center bg-no-repeat bg-[url('/map-background.svg')] flex-col items-center justify-center p-6 md:p-10">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white"></div>
      <Card className="overflow-hidden p-0 z-10">
        <CardContent className="grid p-0 md:grid-cols-2">
          <SlideIn from="left">
            <div className="flex flex-col gap-6 p-10">
              <div className="flex flex-col">
                <Logo />
                <h1 className="text-2xl syncopate-bold mt-10 text-yellow-500">
                  Tableau de bord
                </h1>
                <p className="text-muted-foreground text-balance text-sm">
                  Connectez-vous a votre espace administrateur
                </p>
              </div>
              <Separator />
              <LoginForm
                formType="SIGN_IN"
                schema={SignInSchema}
                defaultValues={{ email: "", password: "" }}
                onSubmit={signInWithCredentials}
              />
            </div>
          </SlideIn>
          <SlideIn
            from="right"
            className="bg-muted relative hidden md:flex flex-col items-center justify-center"
          >
            <Image
              src="/pyramide-img2.jpg"
              fill
              sizes="(max-width: 768px) 100vw, (min-width: 768px) 50vw"
              priority
              draggable={false}
              loading="eager"
              fetchPriority="high"
              style={{ objectFit: "cover" }}
              alt="Image"
              className="absolute dark:brightness-[0.2] dark:grayscale"
            />
          </SlideIn>
        </CardContent>
      </Card>
      <div className="absolute bottom-0 mb-5 z-10">
        © Tous droits reservés. - Pyramide Immobilier.
      </div>
    </div>
  );
}
