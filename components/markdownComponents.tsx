// components/markdownComponents.tsx
import React, { ComponentPropsWithoutRef } from "react";
import ChartRenderer, { ChartConfig } from "./ChartRenderer";
import Link from "next/link";

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
  p: ({ children, ...props }: ComponentPropsWithoutRef<"p">) => (
    <p {...props} className="text-md leading-relaxed">{children}</p>
  ),
  strong: ({ children, ...props }: ComponentPropsWithoutRef<"strong">) => (
    <strong {...props} className="font-semibold">{children}</strong>
  ),
  ul: ({ children, ...props }: ComponentPropsWithoutRef<"ul">) => (
    <ul {...props} className="list-none my-1 text-md">{children}</ul>
  ),
  li: ({ children, ...props }: ComponentPropsWithoutRef<"li">) => (
    <li {...props} className="flex items-start space-x-2 pl-6 my-1 text-[15px]">
      <span className="text-green-500">✅</span>
      <span>{children}</span>
    </li>
  ),
  h1: ({ children, ...props }: ComponentPropsWithoutRef<"h1">) => (
    <h1 {...props} className="text-xl font-bold mb-2">{children}</h1>
  ),
  h2: ({ children, ...props }: ComponentPropsWithoutRef<"h2">) => (
    <h2 {...props} className="text-lg font-semibold my-2">{children}</h2>
  ),
  h3: ({ children, ...props }: ComponentPropsWithoutRef<"h3">) => (
    <h3 {...props} className="text-md font-medium my-2">{children}</h3>
  ),
  h4: ({ children, ...props }: ComponentPropsWithoutRef<"h4">) => (
    <h4 {...props} className="text-sm font-light">{children}</h4>
  ),
  hr: () => <hr className="border-e-2 border-gray-300 dark:border-gray-600 my-4" />,
  blockquote: ({ children, ...props }: ComponentPropsWithoutRef<"blockquote">) => (
    <blockquote {...props} className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic text-gray-700 dark:text-gray-300">
      {children}
    </blockquote>
  ),
  code: ({ children, ...props }: ComponentPropsWithoutRef<"code">) => (
    <code {...props} className="bg-gray-200 dark:bg-gray-800 p-1 rounded text-sm font-mono text-red-600">
      {children}
    </code>
  ),
  a: ({ href = "#", children, ...props }: ComponentPropsWithoutRef<"a">) => (
    <Link href={href} {...props} className="text-blue-600 hover:underline">
      {children}
    </Link>
  ),
  table: ({ children, ...props }: ComponentPropsWithoutRef<"table">) => (
    <table {...props} className="w-full mx-auto my-3 border-collapse rounded-lg overflow-hidden shadow-md my-custom-table">
      {children}
    </table>
  ),
  thead: ({ children, ...props }: ComponentPropsWithoutRef<"thead">) => (
    <thead {...props} className="bg-gray-200 dark:bg-zinc-700 text-gray-900 dark:text-gray-200">
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }: ComponentPropsWithoutRef<"tbody">) => (
    <tbody {...props} className="bg-white dark:bg-gray-900">{children}</tbody>
  ),
  tr: ({ children, ...props }: ComponentPropsWithoutRef<"tr">) => (
    <tr {...props} className="border-b border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600">
      {children}
    </tr>
  ),
  th: ({ children, ...props }: ComponentPropsWithoutRef<"th">) => (
    <th {...props} className="px-3 py-1 text-left text-gray-900 dark:text-gray-100 font-semibold border border-gray-300 dark:border-gray-600">
      {children}
    </th>
  ),
  td: ({ children, ...props }: ComponentPropsWithoutRef<"td">) => (
    <td {...props} className="px-3 py-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
      {children}
    </td>
  ),
  // Eğer HTML içinde <chart> etiketi varsa, ChartTag bileşenini devreye sokalım.
  chart: ({ type, data }: { type: string; data: string }) => <ChartTag type={type} data={data} />,
};
