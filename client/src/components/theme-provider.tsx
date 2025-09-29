import { ThemeContextProvider } from "@/lib/theme-context";

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return <ThemeContextProvider>{children}</ThemeContextProvider>;
}
