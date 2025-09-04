import React from "react";

interface CardProps {
  title: string | number | React.ReactNode; // allow JSX
  value: string | number | React.ReactNode; // also allow JSX if needed
  icon?: React.ReactNode;
  color?: string;
  colorGradient?: string;
  progress?: number;
  rounded?: boolean;
  shadow?: boolean;
  hoverEffect?: boolean;
  children?: React.ReactNode;
}


export default function Card({
  title,
  value,
  icon,
  color = "bg-white",
  colorGradient,
  progress = 0,
  rounded = false,
  shadow = false,
  hoverEffect = false,
  children,
}: CardProps) {
  return (
    <div
      className={`
        relative flex flex-col p-5 ${rounded ? "rounded-xl" : "rounded-lg"}
        ${shadow ? "shadow-lg" : ""} ${hoverEffect ? "hover:scale-105 transform transition-all duration-300" : ""}
        ${colorGradient ? colorGradient : color}
      `}
    >
      {/* Icon */}
      {icon && <div className="flex-shrink-0 mr-4 text-2xl">{icon}</div>}

      {/* Text */}
      <div className="flex-1">
        <p className="text-gray-100 font-semibold text-lg">{title}</p>
        <p className="text-white font-bold text-2xl mt-1">{value}</p>

        {/* Optional progress bar */}
        {progress > 0 && (
          <div className="w-full h-2 bg-gray-300 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-white" style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>
        )}

        {/* Children content */}
        {children && <div className="mt-3">{children}</div>}
      </div>
    </div>
  );
}
