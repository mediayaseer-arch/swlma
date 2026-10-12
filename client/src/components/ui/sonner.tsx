import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="bottom-center"
      richColors
      closeButton
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "group toast border shadow-xl",
          title: "font-semibold",
          description: "opacity-90",
          success: "!bg-emerald-700 !text-white !border-emerald-500",
          error: "!bg-red-700 !text-white !border-red-500",
          warning: "!bg-amber-500 !text-slate-950 !border-amber-300",
          info: "!bg-[#8e4729] !text-white !border-[#c8794f]",
        },
      }}
      style={
        {
          "--normal-bg": "#8e4729",
          "--normal-text": "#ffffff",
          "--normal-border": "#c8794f",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
