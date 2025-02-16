// components/markdownComponents.tsx
import React from "react";
import ChartRenderer, { ChartConfig } from "./ChartRenderer";

// <chart> etiketini işleyen bileşen.
// Beklenen öznitelikler: type ve data (data JSON formatında string olarak verilmelidir)
interface ChartTagProps {
  type: string;
  data: string;
}

export const ChartTag: React.FC<ChartTagProps> = ({ type, data }) => {
  let config: ChartConfig | null = null;
  try {
    config = {
      type: type as "pie" | "bar" | "line",
      data: JSON.parse(data),
    };
  } catch (error) {
    console.error("Error parsing chart configuration:", error);
    return <div>Error parsing chart configuration.</div>;
  }
  return <ChartRenderer config={config} />;
};

export const markdownComponents = {
  p: ({ children }: any) => <p className="text-md leading-relaxed">{children}</p>,
  strong: ({ children }: any) => <strong className="font-semibold">{children}</strong>,
  ul: ({ children }: any) => <ul className="list-none my-1 text-md">{children}</ul>,
  li: ({ children }: any) => (
    <li className="flex items-start space-x-2 pl-6 my-1 text-[15px]">
      <span className="text-green-500">✅</span>
      <span>{children}</span>
    </li>
  ),
  h1: ({ children }: any) => <h1 className="text-xl font-bold mb-2">{children}</h1>,
  h2: ({ children }: any) => <h2 className="text-lg font-semibold my-2">{children}</h2>,
  h3: ({ children }: any) => <h3 className="text-md font-medium my-2">{children}</h3>,
  h4: ({ children }: any) => <h4 className="text-sm font-light">{children}</h4>,
  hr: () => <hr className="border-e-2 border-gray-300 dark:border-gray-600 my-4" />,
  table: ({ children }: any) => (
    <table className="w-full mx-auto my-3 border-collapse rounded-lg overflow-hidden shadow-md my-custom-table">
      {children}
    </table>
  ),
  thead: ({ children }: any) => (
    <thead className="bg-gray-200 dark:bg-zinc-700 text-gray-900 dark:text-gray-200">
      {children}
    </thead>
  ),
  tbody: ({ children }: any) => <tbody className="bg-white dark:bg-gray-900">{children}</tbody>,
  tr: ({ children }: any) => (
    <tr className="border-b border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600">
      {children}
    </tr>
  ),
  th: ({ children }: any) => (
    <th className="px-3 py-1 text-left text-gray-900 dark:text-gray-100 font-semibold border border-gray-300 dark:border-gray-600">
      {children}
    </th>
  ),
  td: ({ children }: any) => (
    <td className="px-3 py-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
      {children}
    </td>
  ),
  // Eğer HTML içinde <chart> etiketi varsa, ChartTag bileşenini devreye sokalım.
  chart: (props: any) => {
    // Eğer rehypeRaw ile HTML parse ediliyorsa, props doğrudan öznitelikleri içerir.
    const { type, data } = props;
    return <ChartTag type={type} data={data} />;
  },
};
