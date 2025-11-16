import Image from "next/image";
import React from "react";

interface LogoProps {
  format?: "mini" | "normal";
}

const Logo2: React.FC<LogoProps> = ({ format = "normal" }) => {
  const dimensions =
    format === "mini" ? { width: 100, height: 20 } : { width: 250, height: 50 };

  return (
    <>
      <Image
        src="/pyramide-logo2Light.svg"
        width={dimensions.width}
        height={dimensions.height}
        alt="BI Logo 2"
        className="dark:hidden"
      />
      <Image
        src="/bi-logo2-light.svg"
        width={dimensions.width}
        height={dimensions.height}
        alt="BI Logo 2 Light"
        className="hidden dark:block"
      />
    </>
  );
};

export default Logo2;
