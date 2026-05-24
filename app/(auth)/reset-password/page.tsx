import ResetPasswordForm from "@/components/forms/reset-password-form";
import Logo from "@/components/Logo";
import SlideIn from "@/components/SlideInWrapper";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { verifyPasswordResetToken } from "@/lib/actions/auth.action";
import Image from "next/image";

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const { token = "" } = await searchParams;
  const tokenCheck = await verifyPasswordResetToken(token);

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center bg-[url('/map-background.svg')] bg-cover bg-center bg-no-repeat p-6 md:p-10">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white" />
      <Card className="z-10 overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <SlideIn from="left">
            <div className="flex flex-col gap-6 p-10">
              <div className="flex flex-col">
                <Logo />
                <h1 className="mt-10 text-2xl syncopate-bold">
                  Nouveau mot de passe
                </h1>
                <p className="text-balance text-sm text-muted-foreground">
                  Choisissez un mot de passe sécurisé pour votre compte.
                </p>
              </div>
              <Separator />
              <ResetPasswordForm
                token={token}
                isTokenValid={tokenCheck.success}
                tokenError={tokenCheck.error?.message}
              />
            </div>
          </SlideIn>
          <SlideIn
            from="right"
            className="bg-muted relative hidden flex-col items-center justify-center md:flex"
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
              className="absolute dark:brightness-[0.8]"
            />
          </SlideIn>
        </CardContent>
      </Card>
      <div className="absolute bottom-0 z-10 mb-5">
        © Tous droits reservés. - Pyramide Immobilier.
      </div>
    </div>
  );
}
