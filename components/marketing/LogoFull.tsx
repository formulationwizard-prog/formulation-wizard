type Props = {
  className?: string;
  alt?: string;
  style?: React.CSSProperties;
};

export default function LogoFull({
  className,
  alt = "Formulation Wizard",
  style,
}: Props) {
  return (
    <img
      src="/marketing/logo-full.svg"
      alt={alt}
      className={className}
      style={style}
    />
  );
}
