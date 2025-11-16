"use client";

import { signUpWithCredentials } from "@/lib/actions/auth.action";
import { SignUpSchema } from "@/lib/validators/auth";
import React from "react";
import AuthForm from "../forms/register-form";
import Logo from "../Logo";

const Register = () => {
  return (
    <div>
      {" "}
      <div className="mx-auto w-fit text-center flex flex-col items-center mb-10">
        <Logo />
      </div>
      <h1 className="text-xl syncopate-bold ">Inscription</h1>
      <p className="syncopate text-sm ">Ajouter un nouveau Utilisateur.</p>
      <AuthForm
        formType="SIGN_UP"
        schema={SignUpSchema}
        defaultValues={{
          firstname: "",
          lastname: "",
          phone: "",
          email: "",
          role: "VIEWER",
          password: "",
          confirmPassword: "",
        }}
        onSubmit={signUpWithCredentials}
      />
    </div>
  );
};

export default Register;
