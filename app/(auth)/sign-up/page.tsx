// app/(auth)/sign-up/page.tsx
"use client";

// Your existing action
import SlideIn from "@/components/SlideInWrapper";
import Link from "next/link";
import { Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import RegisterForm from "@/components/forms/register-form";
import { SignUpSchema } from "@/lib/validators/auth";
import { signUpWithCredentials } from "@/lib/actions/auth.action";

const SignUpClientPage = () => {
  return (
    <SlideIn
      from="right"
      className="min-h-screen flex items-center justify-center p-6"
    >
      <div className="w-full max-w-lg space-y-8 p-8 border rounded-lg shadow-lg bg-card">
        <div className="mx-auto w-fit">
          <Logo format="medium" />
        </div>
        {/* Header and Artist CTA */}
        <div className="text-center space-y-1">
          <h1 className="text-3xl syncopate">Rejoignez PYRAMIDE</h1>
          <p className="text-muted-foreground">
            Créez votre compte client pour acheter et suivre vos listings.
          </p>
        </div>

        <RegisterForm
          formType="SIGN_UP"
          schema={SignUpSchema}
          defaultValues={{
            firstname: "",
            lastname: "",
            username: "",
            phone: "",
            email: "",
            password: "",
            confirmPassword: "",
            role: "ADMIN",
          }}
          onSubmit={signUpWithCredentials}
        />

        <div className="mt-6 pt-4 border-t border-border flex flex-col items-center">
          <p className="text-sm text-muted-foreground mb-3">
            Voulez-vous vendre votre bien ?
          </p>
          <Link href="/sign-up/artist">
            <Button variant="secondary" className="gap-2">
              <Briefcase className="w-4 h-4" />
              Devenir Agent Immobilier
            </Button>
          </Link>
        </div>
      </div>
    </SlideIn>
  );
};

export default SignUpClientPage;
