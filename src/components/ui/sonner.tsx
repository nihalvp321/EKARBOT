import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";
import { X } from "lucide-react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: `
            relative flex items-start gap-2 sm:gap-3 p-3 sm:p-4 min-w-[200px] sm:min-w-[260px] max-w-[300px] sm:max-w-[340px]
            rounded-xl border-2 border-gray-200 dark:border-gray-700
            bg-white dark:bg-gray-900
            shadow-md transition-all duration-300
          `,
          description: "text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 font-sans leading-relaxed",
          actionButton: `
            bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-2 sm:px-3 py-1 rounded-lg
            hover:from-blue-600 hover:to-indigo-700 text-xs sm:text-sm font-medium
            transition-all duration-200
          `,
          cancelButton: `
            bg-red-100/80 text-red-700 px-2 sm:px-3 py-1 rounded-lg
            hover:bg-red-200 text-xs sm:text-sm font-medium
            transition-all duration-200
          `,
          closeButton: `
            absolute bottom-2 right-2 w-6 sm:w-7 h-6 sm:h-7
            flex items-center justify-center rounded-full
            bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800
            text-gray-600 dark:text-gray-300
          `,
        },
      }}
      closeButton
      {...props}
    />
  );
};

export { Toaster, toast };