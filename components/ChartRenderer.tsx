"use client";

import React, { useEffect, useState } from "react";
import { Bar, Pie, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Chart.js 4.x modüllerini kaydediyoruz
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export type ChartConfig = {
  type: "pie" | "bar" | "line";
  data: {
    labels: string[];
    values: number[];
    title: string;
  };
  options?: Record<string, unknown>;
};

type ChartRendererProps = {
  config: ChartConfig;
};

// Orijinal kodunuzdaki arka plan ve kenarlık renkleri
const defaultBackgroundColors = [
  "rgba(255, 99, 132, 0.6)",
  "rgba(54, 162, 235, 0.6)",
  "rgba(255, 206, 86, 0.6)",
  "rgba(75, 192, 192, 0.6)",
  "rgba(153, 102, 255, 0.6)",
];

const defaultBorderColors = [
  "rgba(255, 99, 132, 1)",
  "rgba(54, 162, 235, 1)",
  "rgba(255, 206, 86, 1)",
  "rgba(75, 192, 192, 1)",
  "rgba(153, 102, 255, 1)",
];

export const ChartRenderer: React.FC<ChartRendererProps> = ({ config }) => {
  const { type, data, options } = config;

  // Dark mode'u <html class="dark"> var mı diye kontrol ediyoruz.
  const [darkMode, setDarkMode] = useState(false);

  // Dark mode değiştikçe grafiği yeniden mount etmek için key
  const [chartKey, setChartKey] = useState(0);

  // 1) İlk açılışta <html class="dark"> var mı kontrol et
  // 2) Her 1 saniyede bir tekrar kontrol
  useEffect(() => {
    function checkDarkClass() {
      const hasDarkClass = document.documentElement.classList.contains("dark");
      setDarkMode(hasDarkClass);
    }

    // İlk kontrol
    checkDarkClass();

    // Düzenli kontrol (1 saniyede bir)
    const interval = setInterval(() => {
      checkDarkClass();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Dark mode state değişince grafiği yeniden mount et
  useEffect(() => {
    setChartKey(prev => prev + 1);
    console.log("Dark mode aktif mi?", darkMode);
  }, [darkMode]);

  // Chart.js veri
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: data.title,
        data: data.values,
        backgroundColor: defaultBackgroundColors.slice(0, data.labels.length),
        borderColor: defaultBorderColors.slice(0, data.labels.length),
        borderWidth: 1,
      },
    ],
  };

  // Yeni renkler:
  // Dark mod: yazılar = #e5e7eb, grid = #333333
  // Light mod: yazılar = #374151, grid = #d1d5db
  const darkTickColor = "#e5e7eb";
  const darkLegendColor = "#e5e7eb";
  const darkGridColor = "#333333";

  const lightTickColor = "#374151";
  const lightLegendColor = "#374151";
  const lightGridColor = "#d1d5db";

  let defaultOptions: Record<string, unknown>;
  if (type === "pie") {
    defaultOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
          labels: {
            font: { size: 14 },
            color: darkMode ? darkLegendColor : lightLegendColor,
          },
        },
      },
    };
  } else {
    defaultOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
          labels: {
            font: { size: 14 },
            color: darkMode ? darkLegendColor : lightLegendColor,
          },
        },
      },
      scales: {
        x: {
          grid: {
            color: darkMode ? darkGridColor : lightGridColor,
          },
          ticks: {
            color: darkMode ? darkTickColor : lightTickColor,
            font: { size: 13 },
            autoSkip: false,
          },
        },
        y: {
          grid: {
            color: darkMode ? darkGridColor : lightGridColor,
          },
          ticks: {
            color: darkMode ? darkTickColor : lightTickColor,
            font: { size: 13 },
          },
        },
      },
    };
  }

  // Ek opsiyonlar varsa birleştir
  const mergedOptions = options ? { ...defaultOptions, ...options } : defaultOptions;

  // Konteyner (Tailwind) sınıfları - orijinal kod
  const containerClasses =
    type === "pie"
      ? "w-full max-w-[400px] h-[250px] mx-auto my-5 p-4 bg-gray-100 dark:bg-[#181818] border border-gray-200 dark:border-gray-700 rounded-xl shadow-md"
      : "w-full max-w-[600px] h-[300px] mx-auto my-5 p-4 bg-gray-100 dark:bg-[#181818] border border-gray-200 dark:border-gray-700 rounded-xl shadow-md";

  // Grafik türüne göre render
  if (type === "pie") {
    return (
      <div className={containerClasses}>
        <Pie key={chartKey} data={chartData} options={mergedOptions} />
      </div>
    );
  } else if (type === "bar") {
    return (
      <div className={containerClasses}>
        <Bar key={chartKey} data={chartData} options={mergedOptions} />
      </div>
    );
  } else if (type === "line") {
    return (
      <div className={containerClasses}>
        <Line key={chartKey} data={chartData} options={mergedOptions} />
      </div>
    );
  } else {
    return (
      <div className={containerClasses}>
        <p>Unsupported chart type: {type}</p>
      </div>
    );
  }
};

export default ChartRenderer;
