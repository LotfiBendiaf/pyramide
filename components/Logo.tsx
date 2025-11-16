import Image from "next/image";
import React from "react";

interface LogoProps {
  format?: "mini" | "medium" | "normal";
}

const Logo: React.FC<LogoProps> = ({ format = "medium" }) => {
  const dimensions =
    format === "mini"
      ? { width: 100, height: 20 }
      : format === "medium"
      ? { width: 200, height: 30 }
      : { width: 250, height: 50 };

  return (
    <>
      <Image
        src="/pyramide-logo2.svg"
        width={dimensions.width}
        height={dimensions.height}
        alt="BI Logo 1"
        priority
      />
    </>
  );
};

export default Logo;
