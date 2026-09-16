"use client";

import {
  cloneElement,
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type MouseEventHandler,
  type ReactElement,
  type ReactNode,
} from "react";

import { AnimatePresence, motion } from "motion/react";

import { cn } from "@/src/lib/utils/cn";

type DropdownContextValue = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  triggerId: string;
  panelId: string;
};

type DropdownTriggerChildProps = {
  id?: string;
  "aria-haspopup"?: "true" | "menu";
  "aria-expanded"?: boolean;
  "aria-controls"?: string;
  onClick?: MouseEventHandler<HTMLElement>;
};

const DropdownContext = createContext<DropdownContextValue | null>(null);

function useDropdownContext() {
  const ctx = useContext(DropdownContext);

  if (!ctx) {
    throw new Error("Dropdown.Trigger/Content must be used inside <Dropdown>");
  }

  return ctx;
}

export function Dropdown({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const uid = useId();

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target;

      if (
        target instanceof Node &&
        containerRef.current &&
        !containerRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);

      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <DropdownContext.Provider
      value={{
        isOpen,
        setIsOpen,
        triggerId: `${uid}-trigger`,
        panelId: `${uid}-panel`,
      }}
    >
      <div ref={containerRef} className="relative">
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

export function DropdownTrigger({
  children,
}: {
  children: ReactElement<DropdownTriggerChildProps>;
}) {
  const { isOpen, setIsOpen, triggerId, panelId } = useDropdownContext();

  const originalOnClick = children.props.onClick;

  return cloneElement(children, {
    id: triggerId,
    "aria-haspopup": "menu",
    "aria-expanded": isOpen,
    "aria-controls": panelId,

    onClick: (event) => {
      originalOnClick?.(event);

      if (!event.defaultPrevented) {
        setIsOpen(!isOpen);
      }
    },
  });
}

export function DropdownContent({
  children,
  align = "end",
  className,
}: {
  children: ReactNode;
  align?: "start" | "end";
  className?: string;
}) {
  const { isOpen, triggerId, panelId } = useDropdownContext();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id={panelId}
          role="menu"
          aria-labelledby={triggerId}
          initial={{
            opacity: 0,
            y: -6,
            scale: 0.98,
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          exit={{
            opacity: 0,
            y: -6,
            scale: 0.98,
          }}
          transition={{
            duration: 0.18,
            ease: "easeOut",
          }}
          className={cn(
            "glass-panel absolute top-full z-50 mt-2 max-w-[calc(100vw-1.5rem)] overflow-hidden",
            align === "end" ? "right-0" : "left-0",
            className,
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
