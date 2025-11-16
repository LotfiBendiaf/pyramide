import Image from "next/image";
import React from "react";

interface IconProps {
  format?: "mini" | "normal";
}

const Icon: React.FC<IconProps> = ({ format = "normal" }) => {
  const dimensions = format === "mini" ? { size: 40 } : { size: 120 };

  return (
    <>
      <Image
        src="/pyramide-icon2.svg"
        width={dimensions.size}
        height={dimensions.size}
        alt="BI Icon"
        className="dark:hidden"
      />
      <Image
        src="/bi-icon-light.svg"
        width={dimensions.size}
        height={dimensions.size}
        alt="BI Icon Light"
        className="hidden dark:block"
      />
    </>
  );
};

export default Icon;
