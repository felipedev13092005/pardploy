"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router";

import { Field, FieldLabel, FieldDescription, FieldError } from "@/shared/ui/components/ui/field";
import { Input } from '@/shared/ui/components/ui/input';
import { Button } from "@/shared/ui/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/shared/ui/components/ui/card";
import { useSession } from "@/shared/hooks/use-auth";

// Esquema de validación alineado con AuthPayload de tu backend en Rust
const loginSchema = z.object({
  username: z.string().min(3, "El usuario debe tener al menos 3 caracteres"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const PageLogin = () => {
  const navigate = useNavigate();
  const { session, login } = useSession();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setServerError(null);
    try {
      await login(data);
      // Si el login es exitoso, el hook invalida la sesión y redirigimos
      navigate("/dashboard");
    } catch (error: any) {
      // Capturamos el error (401 Unauthorized del backend)
      setServerError(error.response?.data || "Usuario o contraseña incorrectos");
    }
  };
  useEffect(() => {
    if (!session) {
      return
    }
    navigate('/dashboard')
  }, [session])
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">Bienvenido</CardTitle>
          <CardDescription>
            Ingresa tus credenciales para acceder a Pardploy Engine
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {/* Campo de Usuario */}
            <Field>
              <FieldLabel>Usuario</FieldLabel>
              <Input
                {...register("username")}
                placeholder="felipe"
                autoComplete="username"
                className={errors.username ? "border-destructive" : ""}
              />
              {errors.username ? (
                <FieldError>{errors.username.message}</FieldError>
              ) : (
                <FieldDescription>Tu nombre de usuario registrado.</FieldDescription>
              )}
            </Field>

            {/* Campo de Contraseña */}
            <Field>
              <FieldLabel>Contraseña</FieldLabel>
              <Input
                {...register("password")}
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                className={errors.password ? "border-destructive" : ""}
              />
              {errors.password && <FieldError>{errors.password.message}</FieldError>}
            </Field>

            {/* Error proveniente del Backend (Axum) */}
            {serverError && (
              <div className="p-3 text-sm font-medium text-destructive bg-destructive/10 rounded-md border border-destructive/20">
                {serverError}
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Protegido por Pardploy Auth Service
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default PageLogin;
