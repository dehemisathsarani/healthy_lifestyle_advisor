import React from "react";

type CardProps = {
  title: string;
  value: string | number;
  color?: string; // optional, defaults to "bg-blue-500"
};

const Card: React.FC<CardProps> = ({ title, value, color = "bg-blue-500" }) => {
  return (
    <div className={`p-4 rounded shadow ${color} text-white`}>
      <h3 className="font-bold">{title}</h3>
      <p className="text-2xl mt-2">{value}</p>
    </div>
  );
};

export default Card;
