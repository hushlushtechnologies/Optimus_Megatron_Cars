"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ChevronsLeft, ChevronsRight, LogOut } from "lucide-react";

import { NAV_SECTIONS } from "@/src/config/nav";
import { useSidebar } from "@/src/hooks/use-sidebar";
import { useFocusTrap } from "@/src/hooks/use-focus-trap";

import { IconButton } from "@/src/components/ui/icon-button";

import { logout } from "@/app/admin/log-out-actions";

import { cn } from "@/src/lib/utils/cn";

interface AdminSidebarProps {
  userName: string;
  userRole: string;
}

/*
|--------------------------------------------------------------------------
| LOGOS
|--------------------------------------------------------------------------
*/

const FULL_LOGO = "/logo/main-logo.svg";
const LOGO_MARK = "/logo/mark-logo.svg";

/*
|--------------------------------------------------------------------------
| ADMIN SIDEBAR
|--------------------------------------------------------------------------
*/

export function AdminSidebar({ userName, userRole }: AdminSidebarProps) {
  const pathname = usePathname();

  const { isCollapsed, toggleCollapsed, setMobileOpen } = useSidebar();

  return (
    <div className="border-border bg-sidebar-background relative flex h-full flex-col overflow-hidden rounded-[24px] border shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
      {/* =====================================================
          BRAND
      ===================================================== */}

      <div
        className={cn(
          "relative mx-auto flex shrink-0 items-center justify-center",
          "h-23",
          isCollapsed ? "justify-center px-3" : "px-5",
        )}
      >
        <AnimatePresence mode="wait">
          {isCollapsed ? (
            <motion.div
              key="logo-mark"
              initial={{
                opacity: 0,
                scale: 0.9,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                scale: 0.9,
              }}
              transition={{
                duration: 0.18,
              }}
              className="flex size-10 items-center justify-center"
            >
              <Image
                src={LOGO_MARK}
                alt="Optimus Megatron"
                width={50}
                height={50}
                priority
                className="h-auto w-full object-contain"
              />
            </motion.div>
          ) : (
            <motion.div
              key="full-logo"
              initial={{
                opacity: 0,
                x: -8,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              exit={{
                opacity: 0,
                x: -8,
              }}
              transition={{
                duration: 0.18,
              }}
              className="relative h-11.5 w-46.25"
            >
              <Image
                src={FULL_LOGO}
                alt="Optimus Megatron Cars"
                fill
                priority
                sizes="200px"
                className="object-contain object-center"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* subtle bottom highlight */}

        <div
          aria-hidden="true"
          className="via-primary/40 pointer-events-none absolute right-5 bottom-0 left-5 h-px bg-linear-to-r from-transparent to-transparent"
        />
      </div>

      {/* =====================================================
          NAVIGATION
      ===================================================== */}

      <nav className="flex-1 scrollbar-none overflow-y-auto px-3 py-4 [&::-webkit-scrollbar]:hidden">
        {NAV_SECTIONS.map((section, sectionIndex) => (
          <div key={section.title} className={cn(sectionIndex !== NAV_SECTIONS.length - 1 && "mb-5")}>
            {/* Section title */}

            {!isCollapsed && section.title && (
              <div className="mb-2 px-3">
                <p className="text-text-muted text-[10px] font-semibold tracking-[0.24em] uppercase">
                  {section.title}
                </p>
              </div>
            )}

            <ul className="flex flex-col gap-1">
              {section.items.map((item) => {
                /*
                 * Keep parent navigation active
                 * for nested routes.
                 *
                 * Example:
                 * /admin/customers/123
                 * keeps Customers active.
                 */

                const isActive =
                  pathname === item.href || (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));

                const Icon = item.icon;

                return (
                  <li key={item.href} className="relative">
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      title={isCollapsed ? item.label : undefined}
                      className={cn(
                        [
                          "group",
                          "relative",
                          "flex",
                          "h-11",
                          "items-center",
                          "rounded-xl",
                          "transition-all",
                          "duration-200",
                        ],

                        isCollapsed ? "justify-center px-2" : "gap-3 px-3",

                        isActive
                          ? "text-primary-light"
                          : ["text-text-subtle", "hover:bg-sidebar-hover", "hover:text-text-primary"],
                      )}
                    >
                      {/* Active background */}

                      {isActive && (
                        <motion.span
                          layoutId="sidebar-active-pill"
                          className="border-primary/10 from-primary/[0.14] via-primary/6 absolute inset-0 rounded-xl border bg-linear-to-r to-transparent"
                          transition={{
                            type: "spring",
                            stiffness: 420,
                            damping: 34,
                          }}
                        />
                      )}

                      {/* Active left indicator */}

                      {isActive && !isCollapsed && (
                        <motion.span
                          layoutId="sidebar-active-indicator"
                          className="bg-primary absolute top-1/2 -left-0.5 h-5 w-0.5 -translate-y-1/2 rounded-full shadow-[0_0_12px_rgba(212,175,55,0.6)]"
                        />
                      )}

                      {/* Icon */}

                      <Icon
                        aria-hidden="true"
                        className={cn(
                          "relative z-10 size-4.5 shrink-0 transition-all duration-200",

                          isActive ? "text-primary" : ["text-text-subtle", "group-hover:text-text-primary"],
                        )}
                      />

                      {/* Label */}

                      {!isCollapsed && (
                        <span className="relative z-10 flex-1 truncate text-[12px] font-medium">
                          {item.label}
                        </span>
                      )}

                      {/* Hover glow */}

                      <span
                        aria-hidden="true"
                        className="bg-primary/5 pointer-events-none absolute right-4 size-14 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* =====================================================
          BOTTOM AREA
      ===================================================== */}

      <div className="shrink-0 px-3 pb-3">
        {/* Powered by */}

        {!isCollapsed && (
          <div className="mb-3 border-t border-white/6 px-2 pt-4">
            <div className="text-text-subtle flex items-center justify-center gap-2 text-[10px]">
              <span>Powered by</span>

              <span className="text-text-muted font-semibold">Hush Lush Technologies</span>
            </div>
          </div>
        )}

        {/* Profile card */}

        <div
          className={cn(
            [
              "relative",
              "overflow-hidden",
              "rounded-2xl",
              "border",
              "border-white/[0.07]",
              "bg-white/2.5",
              "transition-all",
              "duration-200",
              "hover:border-primary/15",
              "hover:bg-white/4",
            ],

            isCollapsed ? "flex justify-center p-2" : "p-3",
          )}
        >
          <div
            className={cn(
              "relative z-10 flex items-center",

              isCollapsed ? "justify-center" : "gap-3",
            )}
          >
            {/* Avatar */}

            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-(--omc-gradient-primary) text-sm font-bold text-[#0b1220] shadow-[0_8px_20px_rgba(212,175,55,0.15)]">
              {userName.charAt(0).toUpperCase()}
            </div>

            {!isCollapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <p className="text-body-sm text-text-primary truncate font-medium">{userName}</p>

                  <p className="text-text-subtle mt-0.5 truncate text-[11px]">{userRole}</p>
                </div>

                <form action={logout}>
                  <IconButton
                    aria-label="Sign out"
                    variant="ghost"
                    size="sm"
                    type="submit"
                    className="text-text-subtle hover:bg-red-500/8 hover:text-red-400"
                  >
                    <LogOut className="size-4" />
                  </IconButton>
                </form>
              </>
            )}
          </div>

          {/* subtle avatar glow */}

          <div
            aria-hidden="true"
            className="bg-primary/6 pointer-events-none absolute -bottom-12 -left-8 size-24 rounded-full blur-2xl"
          />
        </div>

        {/* Collapsed sign out */}

        {isCollapsed && (
          <form action={logout} className="mt-2 flex justify-center">
            <IconButton
              aria-label="Sign out"
              variant="ghost"
              size="sm"
              type="submit"
              className="text-text-subtle hover:bg-red-500/8 hover:text-red-400"
            >
              <LogOut className="size-4" />
            </IconButton>
          </form>
        )}
      </div>

      {/* =====================================================
          DESKTOP COLLAPSE CONTROL
      ===================================================== */}

      <button
        type="button"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        onClick={toggleCollapsed}
        className="text-text-subtle hover:border-primary/25 hover:text-primary absolute top-1/2 -right-px z-30 hidden h-10 w-5.5 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/8 bg-[#071126] shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-all duration-200 lg:flex"
      >
        {isCollapsed ? <ChevronsRight className="size-3.5" /> : <ChevronsLeft className="size-3.5" />}
      </button>
    </div>
  );
}

/* =========================================================
   SIDEBAR LAYOUT
========================================================= */

export function AdminSidebarLayout(props: AdminSidebarProps) {
  const { isCollapsed, isMobileOpen, setMobileOpen } = useSidebar();

  /*
   * Mobile drawer ref.
   *
   * Used by useFocusTrap so keyboard focus
   * remains inside the navigation drawer
   * while it is open.
   */
  const drawerRef = useRef<HTMLElement>(null);

  /*
   * Accessibility:
   *
   * - traps keyboard focus inside drawer
   * - releases focus when drawer closes
   * - allows Escape handling through the hook
   */
  useFocusTrap(drawerRef, isMobileOpen, () => setMobileOpen(false));

  return (
    <>
      {/* =====================================================
          DESKTOP

          Floating sidebar spacing:
          12px top
          12px bottom
          12px left
      ===================================================== */}

      <motion.aside
        animate={{
          width: isCollapsed ? 92 : 292,
        }}
        transition={{
          duration: 0.25,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="sticky top-0 hidden h-screen shrink-0 p-3 pr-2 lg:block"
      >
        <AdminSidebar {...props} />
      </motion.aside>

      {/* =====================================================
          MOBILE DRAWER
      ===================================================== */}

      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Backdrop */}

            <motion.div
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              transition={{
                duration: 0.2,
              }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[3px] lg:hidden"
              aria-hidden="true"
            />

            {/* Mobile floating sidebar */}

            <motion.aside
              ref={drawerRef}
              initial={{
                x: "-110%",
                opacity: 0,
              }}
              animate={{
                x: 0,
                opacity: 1,
              }}
              exit={{
                x: "-110%",
                opacity: 0,
              }}
              transition={{
                duration: 0.3,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="fixed top-3 bottom-3 left-3 z-50 w-70 lg:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
            >
              <AdminSidebar {...props} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
