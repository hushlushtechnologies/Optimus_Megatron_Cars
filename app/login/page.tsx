"use client";

import { Suspense, useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { loginSchema, type LoginFormValues } from "@/src/lib/validation/auth";
import { login } from "./actions";

const SHOWROOM_IMAGE = "/logo/showroom.png";
const LOGO_IMAGE = "/logo/main-logo.svg";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginExperience />
    </Suspense>
  );
}

function safeRedirect(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\r\n\t]/.test(value)) return "/admin";
  return value;
}

function LoginExperience() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [logoFailed, setLogoFailed] = useState(false);
  const [pointer, setPointer] = useState({ x: 52, y: 44 });
  const [pointerActive, setPointerActive] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
  });

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel || !window.matchMedia("(pointer: fine)").matches) return;
    const move = (event: PointerEvent) => {
      const rect = panel.getBoundingClientRect();
      setPointer({
        x: ((event.clientX - rect.left) / rect.width) * 100,
        y: ((event.clientY - rect.top) / rect.height) * 100,
      });
    };
    const enter = () => setPointerActive(true);
    const leave = () => setPointerActive(false);
    panel.addEventListener("pointermove", move);
    panel.addEventListener("pointerenter", enter);
    panel.addEventListener("pointerleave", leave);
    return () => {
      panel.removeEventListener("pointermove", move);
      panel.removeEventListener("pointerenter", enter);
      panel.removeEventListener("pointerleave", leave);
    };
  }, []);

  async function onSubmit(values: LoginFormValues) {
    setFormError(null);
    try {
      const result = await login(values);
      if (result.error) {
        setFormError(result.error);
        return;
      }
      router.replace(safeRedirect(searchParams.get("redirectTo")));
      router.refresh();
    } catch {
      setFormError("Unable to sign in right now. Please try again.");
    }
  }

  const lightStyle = {
    "--spot-x": `${pointer.x}%`,
    "--spot-y": `${pointer.y}%`,
    "--spot-opacity": pointerActive ? "1" : "0.55",
  } as CSSProperties;

  return (
    <main
      id="main-content"
      className="bg-base text-text-primary min-h-dvh lg:grid lg:grid-cols-[minmax(0,1.18fr)_minmax(430px,.82fr)]"
    >
      <style>{`
        @keyframes omc-reveal { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
        @keyframes omc-photo { from { transform:scale(1.09); filter:blur(4px) } to { transform:scale(1); filter:blur(0) } }
        @keyframes omc-glow { 0%,100% { opacity:.35; transform:translateX(-10%) } 50% { opacity:.8; transform:translateX(15%) } }
        @keyframes omc-trail { from { transform:translateX(-125%) } to { transform:translateX(225%) } }
        .omc-enter { animation:omc-reveal .8s cubic-bezier(.2,.7,.2,1) both }
        .omc-photo { animation:omc-photo 1.7s cubic-bezier(.2,.7,.2,1) both }
        .omc-trail { animation:omc-trail 8s linear infinite }
        .omc-glow { animation:omc-glow 9s ease-in-out infinite }
        @media (prefers-reduced-motion:reduce) { .omc-enter,.omc-photo,.omc-trail,.omc-glow { animation:none!important } }
      `}</style>

      <section
        ref={panelRef}
        aria-label="Optimus Megatron Cars showroom"
        style={lightStyle}
        className="relative isolate hidden min-h-dvh overflow-hidden bg-[#06101e] lg:flex lg:flex-col lg:justify-between"
      >
        <div className="absolute inset-0 -z-20 overflow-hidden">
          <Image
            src={SHOWROOM_IMAGE}
            alt="Optimus Megatron Cars dealership showroom and luxury vehicle lineup"
            fill
            priority
            sizes="(min-width:1024px) 60vw, 100vw"
            className="omc-photo object-cover object-center"
          />
        </div>
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-[#020711]/65 via-[#020711]/10 to-[#020711]/95" />
        <div
          className="pointer-events-none absolute inset-0 -z-10 transition-opacity duration-700"
          style={{
            opacity: "var(--spot-opacity)",
            background:
              "radial-gradient(ellipse 48% 40% at var(--spot-x) var(--spot-y), rgba(235,184,17,.22), transparent 75%)",
          }}
        />
        <div className="omc-glow pointer-events-none absolute top-[-15%] -right-24 h-[130%] w-44 rotate-[14deg] bg-gradient-to-r from-transparent via-[#e7b65d]/10 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute right-0 bottom-[17%] left-0 h-px overflow-hidden bg-white/10">
          <div className="omc-trail h-full w-1/2 bg-gradient-to-r from-transparent via-[#f6df8d] to-transparent shadow-[0_0_20px_#ebb811]" />
        </div>

        <div className="omc-enter relative flex items-center justify-between px-10 pt-10 xl:px-14">
          <div className="flex items-center gap-3 text-white/90">
            <span className="flex size-9 items-center justify-center rounded-full border border-[#e7b65d]/60 bg-black/25 text-[#f6df8d]">
              <Sparkles size={17} />
            </span>
            <div>
              <p className="text-[10px] font-semibold tracking-[.32em] text-[#f6df8d]">
                OPTIMUS MEGATRON CARS
              </p>
              <p className="mt-1 text-[10px] tracking-[.16em] text-white/65">
                EXCLUSIVE AUTOMOTIVE EXPERIENCE
              </p>
            </div>
          </div>
          <span className="rounded-full border border-white/20 bg-black/25 px-3 py-1.5 text-[10px] font-medium tracking-[.18em] text-white/85 backdrop-blur-md">
            STAFF PORTAL
          </span>
        </div>

        <div
          className="omc-enter relative px-10 pt-36 pb-12 xl:px-14 xl:pb-16"
          style={{ animationDelay: "160ms" }}
        >
          <div className="mb-5 flex items-center gap-3">
            <span className="h-px w-10 bg-[#eac06a]" />
            <span className="text-[11px] font-semibold tracking-[.34em] text-[#f6df8d]">
              A STANDARD ABOVE
            </span>
          </div>
          <h1 className="max-w-[720px] font-serif text-[clamp(3.6rem,5.4vw,7rem)] leading-[.91] font-medium tracking-[-.045em] text-white drop-shadow-lg">
            Driven by
            <br />
            <span className="bg-gradient-to-r from-[#fff0bb] via-[#e4b95d] to-[#c39030] bg-clip-text text-transparent">
              Excellence.
            </span>
          </h1>
          <p className="mt-7 max-w-lg text-base text-sm leading-7 text-white">
            A premium showroom experience, powered by a workspace designed for the people behind every
            exceptional journey.
          </p>
          <div className="mt-10 grid max-w-[590px] grid-cols-3 border-t border-white/25 pt-6 text-white/85">
            {["PREMIUM COLLECTION", "TRUSTED EXPERIENCE", "EXCEPTIONAL SERVICE"].map((item, i) => (
              <div key={item} className={`pr-3 ${i ? "border-l border-white/20 pl-5" : ""}`}>
                <span className="mb-2 block h-1 w-6 rounded-full bg-[#eac06a]" />
                <span className="text-[10px] leading-5 font-semibold tracking-[.13em]">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-base relative flex min-h-dvh flex-col justify-center overflow-hidden px-6 py-12 sm:px-12 lg:px-12 xl:px-[min(6vw,100px)]">
        <div className="bg-primary/[.055] pointer-events-none absolute -top-40 -right-40 size-[480px] rounded-full blur-[100px]" />
        <div className="via-primary/50 pointer-events-none absolute top-0 left-0 hidden h-full w-px bg-gradient-to-b from-transparent to-transparent lg:block" />
        <div className="omc-enter relative mx-auto w-full max-w-[440px]">
          <div className="mb-12 flex justify-center lg:mb-14">
            {!logoFailed ? (
              <Image
                src={LOGO_IMAGE}
                alt="Optimus Megatron Cars"
                width={240}
                height={120}
                unoptimized
                onError={() => setLogoFailed(true)}
                className="h-auto max-h-28 w-auto max-w-[240px] object-contain"
              />
            ) : (
              <div className="text-center">
                <p className="text-primary text-xs font-semibold tracking-[.36em]">OPTIMUS</p>
                <p className="text-text-primary mt-1 text-2xl font-bold tracking-[.16em]">MEGATRON</p>
                <p className="text-primary mt-1 text-xs tracking-[.45em]">CARS</p>
              </div>
            )}
          </div>
          <div className="mb-9">
            <p className="text-primary mb-3 text-[11px] font-semibold tracking-[.28em] uppercase">
              Private management portal
            </p>
            <h2 className="text-text-primary font-serif text-4xl font-medium tracking-tight sm:text-[44px]">
              Welcome back<span className="text-primary">.</span>
            </h2>
            <p className="text-text-muted mt-3 text-sm">Sign in with your authorized staff account.</p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            <div>
              <label htmlFor="login-email" className="text-text-primary mb-2 block text-sm font-medium">
                Email address
              </label>
              <div className="relative">
                <Mail
                  aria-hidden="true"
                  className="text-text-muted pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2"
                />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="name@company.com"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "login-email-error" : undefined}
                  {...register("email")}
                  className="border-border bg-card text-text-primary placeholder:text-text-subtle hover:border-primary/40 focus:border-primary focus:ring-primary/10 aria-[invalid=true]:border-danger h-13 w-full rounded-xl border pr-4 pl-12 text-sm transition-all outline-none focus:ring-4"
                />
              </div>
              {errors.email && (
                <p id="login-email-error" role="alert" className="text-danger mt-2 text-xs">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="login-password" className="text-text-primary text-sm font-medium">
                  Password
                </label>
              </div>
              <div className="relative">
                <LockKeyhole
                  aria-hidden="true"
                  className="text-text-muted pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2"
                />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  aria-invalid={!!errors.password}
                  aria-describedby={
                    [errors.password ? "login-password-error" : "", capsLock ? "login-caps-warning" : ""]
                      .filter(Boolean)
                      .join(" ") || undefined
                  }
                  {...register("password")}
                  onKeyDown={(event) => setCapsLock(event.getModifierState("CapsLock"))}
                  onKeyUp={(event) => setCapsLock(event.getModifierState("CapsLock"))}
                  className="border-border bg-card text-text-primary placeholder:text-text-subtle hover:border-primary/40 focus:border-primary focus:ring-primary/10 aria-[invalid=true]:border-danger h-13 w-full rounded-xl border pr-12 pl-12 text-sm transition-all outline-none focus:ring-4"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="text-text-muted hover:bg-card-hover hover:text-primary absolute top-1/2 right-2 flex size-10 -translate-y-1/2 items-center justify-center rounded-lg transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p id="login-password-error" role="alert" className="text-danger mt-2 text-xs">
                  {errors.password.message}
                </p>
              )}
              {capsLock && (
                <p id="login-caps-warning" className="text-warning mt-2 text-xs">
                  Caps Lock is on.
                </p>
              )}
            </div>
            {formError && (
              <div
                role="alert"
                className="border-danger/35 bg-danger/10 text-danger rounded-xl border px-4 py-3 text-sm"
              >
                {formError}
              </div>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="group bg-gradient-primary relative mt-2 flex h-13 w-full items-center justify-center gap-3 overflow-hidden rounded-xl px-5 font-semibold text-[#091020] shadow-[0_8px_28px_rgba(235,184,17,.16)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_34px_rgba(235,184,17,.25)] active:translate-y-0 disabled:cursor-wait disabled:opacity-65 disabled:hover:translate-y-0"
            >
              <span
                className="absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-white/25 transition-transform duration-700 group-hover:translate-x-[500%]"
                aria-hidden="true"
              />
              <span className="relative">{isSubmitting ? "Signing in…" : "Sign in to dashboard"}</span>
              {!isSubmitting && (
                <ArrowRight
                  className="relative size-[18px] transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              )}
            </button>
          </form>
          <div className="mt-10 flex items-center gap-3">
            <span className="bg-border h-px flex-1" />
            <span className="text-text-subtle text-[10px] font-semibold tracking-[.2em] uppercase">
              Secure access
            </span>
            <span className="bg-border h-px flex-1" />
          </div>
          <div className="border-border bg-card/60 mt-5 flex items-start gap-3 rounded-xl border p-4">
            <ShieldCheck aria-hidden="true" className="text-primary mt-0.5 size-5 shrink-0" />
            <p className="text-text-muted text-xs leading-6">
              This is a restricted area for authorized Optimus Megatron Cars staff only.
            </p>
          </div>
          <p className="text-text-subtle mt-12 text-center text-[12px]">
            © {new Date().getFullYear()} Optimus Megatron Cars. Designed by Hushlush Technologies. All rights
            reserved.
          </p>
        </div>
      </section>
    </main>
  );
}

function LoginLoading() {
  return (
    <main aria-busy="true" className="bg-base flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="bg-card-hover mx-auto h-20 w-48 animate-pulse rounded-xl" />
        <div className="bg-card-hover h-12 w-3/4 animate-pulse rounded-xl" />
        <div className="bg-card-hover h-13 animate-pulse rounded-xl" />
        <div className="bg-card-hover h-13 animate-pulse rounded-xl" />
        <div className="bg-primary/20 h-13 animate-pulse rounded-xl" />
      </div>
    </main>
  );
}
