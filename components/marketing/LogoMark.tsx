type Props = {
  className?: string;
  size?: number;
  alt?: string;
};

export default function LogoMark({ className, size = 28, alt = "" }: Props) {
  return (
    <img
      src="/marketing/logo-mark.svg"
      alt={alt}
      width={size}
      height={size}
      className={className}
    />
  );
}
