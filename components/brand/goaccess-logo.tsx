import Image from "next/image";

type GoAccessLogoProps = {
  className?: string;
  priority?: boolean;
};

export function GoAccessLogo({ className, priority = false }: GoAccessLogoProps) {
  return (
    <Image
      alt="GoAccess"
      className={className}
      height={58}
      priority={priority}
      src="/brand/goaccess-approved-logo.png"
      unoptimized
      width={280}
    />
  );
}
