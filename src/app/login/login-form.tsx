"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { BrandLogo } from "@/components/brand-logo";

type Mode = "login" | "signup";

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const isSignUp = mode === "signup";

  function changeMode(nextMode: Mode) {
    setMode(nextMode);
    setErrorMessage("");
    setSuccessMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (isSignUp && password !== confirmPassword) {
      setErrorMessage("As senhas não coincidem.");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();

      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: name.trim() },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
          },
        });

        if (error) throw error;

        if (data.session) {
          router.replace("/dashboard");
          router.refresh();
          return;
        }

        setSuccessMessage(
          "Cadastro iniciado. Verifique seu e-mail para confirmar a conta e concluir o acesso."
        );
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.message.toLowerCase().includes("email not confirmed")) {
          throw new Error("Confirme seu endereço de e-mail antes de entrar.");
        }

        throw new Error("E-mail ou senha incorretos.");
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível concluir a operação. Tente novamente."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f3ef] text-[#20221f]">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden bg-[#1e2923] px-12 py-12 text-[#f5f3ef] lg:flex lg:flex-col lg:justify-between xl:px-20">
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full border border-[#d8b56a]/20" />
          <div className="absolute -bottom-40 -left-32 h-[30rem] w-[30rem] rounded-full border border-[#d8b56a]/10" />

          <div className="relative z-10">
            <BrandLogo variant="light" />
          </div>

          <div className="relative z-10 max-w-xl">
            <p className="mb-5 text-sm font-medium uppercase tracking-[0.2em] text-[#d8b56a]">
              Gestão de parcerias e performance
            </p>
            <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight xl:text-6xl">
              Suas parcerias. Seus resultados. Em perspectiva.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-[#b9c0ba] xl:text-lg">
              Acompanhe marcas, organize publicações, registre vendas e entenda
              o resultado real de cada parceria em um só lugar.
            </p>

            <div className="mt-10 grid max-w-md grid-cols-3 gap-6 border-t border-white/10 pt-6">
              {[
                ["01", "Campanhas"],
                ["02", "Vendas"],
                ["03", "Resultados"],
              ].map(([number, label]) => (
                <div key={number}>
                  <p className="text-2xl font-semibold">{number}</p>
                  <p className="mt-1 text-xs text-[#9da69f]">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="relative z-10 text-xs text-[#7f8982]">
            Auriventa <span className="mx-1 text-white/25">·</span> Sales &amp; Publi Tracker
          </p>
        </section>

        <section className="flex min-h-screen items-center justify-center px-6 py-12 sm:px-10">
          <div className="w-full max-w-md">
            <div className="mb-12 lg:hidden">
              <BrandLogo variant="dark" />
            </div>

            <div className="mb-8">
              <p className="mb-3 text-sm font-medium text-[#66736a]">
                {isSignUp ? "Comece agora" : "Bem-vindo de volta"}
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-[#20221f]">
                {isSignUp ? "Crie sua conta" : "Acesse sua conta"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#737873]">
                {isSignUp
                  ? "Organize suas campanhas e acompanhe seus resultados."
                  : "Entre para continuar acompanhando seus resultados."}
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {isSignUp && (
                <div>
                  <label htmlFor="name" className="mb-2 block text-sm font-medium">
                    Nome
                  </label>
                  <div className="relative">
                    <UserRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b918d]" />
                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      required
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Seu nome"
                      className="h-12 w-full rounded-xl border border-[#d9d8d3] bg-white pl-10 pr-4 text-sm outline-none transition placeholder:text-[#a4a7a4] focus:border-[#1e2923] focus:ring-2 focus:ring-[#1e2923]/10"
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b918d]" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="voce@email.com"
                    className="h-12 w-full rounded-xl border border-[#d9d8d3] bg-white pl-10 pr-4 text-sm outline-none transition placeholder:text-[#a4a7a4] focus:border-[#1e2923] focus:ring-2 focus:ring-[#1e2923]/10"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium">
                  Senha
                </label>
                <div className="relative">
                  <LockKeyhole className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b918d]" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                    minLength={6}
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Mínimo de 6 caracteres"
                    className="h-12 w-full rounded-xl border border-[#d9d8d3] bg-white pl-10 pr-12 text-sm outline-none transition placeholder:text-[#a4a7a4] focus:border-[#1e2923] focus:ring-2 focus:ring-[#1e2923]/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8b918d] transition hover:text-[#1e2923]"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {isSignUp && (
                <div>
                  <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium">
                    Confirmar senha
                  </label>
                  <div className="relative">
                    <LockKeyhole className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b918d]" />
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      minLength={6}
                      required
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="Digite a senha novamente"
                      className="h-12 w-full rounded-xl border border-[#d9d8d3] bg-white pl-10 pr-4 text-sm outline-none transition placeholder:text-[#a4a7a4] focus:border-[#1e2923] focus:ring-2 focus:ring-[#1e2923]/10"
                    />
                  </div>
                </div>
              )}

              {errorMessage && (
                <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {errorMessage}
                </p>
              )}

              {successMessage && (
                <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  {successMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1e2923] text-sm font-semibold text-white transition hover:bg-[#29382f] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting
                  ? "Aguarde..."
                  : isSignUp
                    ? "Criar conta"
                    : "Entrar"}
                {!isSubmitting && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
              </button>
            </form>

            <div className="mt-8 text-center text-sm text-[#737873]">
              {isSignUp ? "Já possui uma conta?" : "Ainda não possui uma conta?"}{" "}
              <button
                type="button"
                onClick={() => changeMode(isSignUp ? "login" : "signup")}
                className="font-semibold text-[#1e2923] underline-offset-4 transition hover:underline"
              >
                {isSignUp ? "Entrar" : "Criar conta"}
              </button>
            </div>

            <p className="mt-12 text-center text-xs leading-5 text-[#a0a39f]">
              Auriventa · Gestão de parcerias, publicações e resultados
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
