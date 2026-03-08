import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      duration={1500}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[hsl(330,80%,55%)] group-[.toaster]:text-white group-[.toaster]:border-[hsl(330,80%,45%)] group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-white/80",
          actionButton: "group-[.toast]:bg-white group-[.toast]:text-[hsl(330,80%,55%)]",
          cancelButton: "group-[.toast]:bg-white/20 group-[.toast]:text-white",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
