import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export const ThemeToggle = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") || "light";
    setIsDarkMode(storedTheme === "dark");
    document.documentElement.classList.toggle("dark", storedTheme === "dark");
  }, []);

  const toggleTheme = () => {
    const newTheme = isDarkMode ? "light" : "dark";
    setIsDarkMode(!isDarkMode);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", !isDarkMode);
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme}>
      {isDarkMode ? (
        <Sun className="h-10 w-10 text-yellow-500" />
      ) : (
        <Moon className="h-10 w-10 text-gray-500" />
      )}
    </Button>
  );
};
