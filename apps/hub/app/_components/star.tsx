/** The star of the Altair wordmark (the dot of its i), as a small ornament. */
export function Star({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 0Q13.3 10.7 24 12Q13.3 13.3 12 24Q10.7 13.3 0 12Q10.7 10.7 12 0Z" fill="currentColor" />
    </svg>
  );
}
