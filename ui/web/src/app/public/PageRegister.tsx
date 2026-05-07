"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate, Link } from "react-router";

import { Field, FieldLabel, FieldDescription, FieldError } from "@/shared/ui/components/ui/field";
import { Input } from '@/shared/ui/components/ui/input';
import { Button } from "@/shared/ui/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/shared/ui/components/ui/card";
import { useSession } from "@/shared/hooks/use-auth";

// Esquema alineado con AuthPayload del backend
const registerSchema = z.object({
  username: z.string().min(3, "El usuario debe tener al menos 3 caracteres"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  confirmPassword: z.string().min(6, "Debes confirmar la contraseña"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const PageRegister = () => {
  const navigate = useNavigate();
  const { session, loading, register: registerUser } = useSession();
  const [serverError, setServerError] = useState<string | null>(null);

  // Evitar que usuarios ya autenticados vean esta página
  useEffect(() => {
    if (session === true) {
      navigate("/dashboard", { replace: true });
    }
  }, [session, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setServerError(null);
    try {
      // Enviamos solo username y password al backend (AuthPayload)
      await registerUser({
        username: data.username,
        password: data.password
      });

      // Registro exitoso: redirigimos al login
      navigate("/login", { state: { registered: true } });
    } catch (error: any) {
      // Capturamos el 409 Conflict o errores de validación de Axum
      setServerError(error.response?.data || "Error al crear la cuenta");
    }
  };

  if (loading && !session) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <Card className="w-full max-w-md shadow-lg animate-in fade-in duration-500">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">Crear cuenta</CardTitle>
          <CardDescription>
            Regístrate para empezar a usar Pardploy Engine
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {/* Usuario */}
            <Field>
              <FieldLabel>Usuario</FieldLabel>
              <Input
                {...register("username")}
                placeholder="felipe"
                className={errors.username ? "border-destructive" : ""}
              />
              {errors.username ? (
                <FieldError>{errors.username.message}</FieldError>
              ) : (
                <FieldDescription>Mínimo 3 caracteres.</FieldDescription>
              )}
            </Field>

            {/* Contraseña */}
            <Field>
              <FieldLabel>Contraseña</FieldLabel>
              <Input
                {...register("password")}
                type="password"
                placeholder="••••••••"
                className={errors.password ? "border-destructive" : ""}
              />
              {errors.password && <FieldError>{errors.password.message}</FieldError>}
            </Field>

            {/* Confirmar Contraseña (Solo validación local en Zod) */}
            <Field>
              <FieldLabel>Confirmar Contraseña</FieldLabel>
              <Input
                {...register("confirmPassword")}
                type="password"
                placeholder="••••••••"
                className={errors.confirmPassword ? "border-destructive" : ""}
              />
              {errors.confirmPassword && <FieldError>{errors.confirmPassword.message}</FieldError>}
            </Field>

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
              {isSubmitting ? "Creando cuenta..." : "Registrarse"}
            </Button>

            <div className="text-sm text-center text-muted-foreground">
              ¿Ya tienes cuenta?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Inicia sesión
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default PageRegister;
