export function Icon({
  name,
  className = ''
}: {
  name: string
  className?: string
}): React.JSX.Element {
  return <span className={`codicon codicon-${name} ${className}`} aria-hidden />
}
