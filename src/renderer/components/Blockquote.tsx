interface BlockquoteProps {
  className?: string
  children: React.ReactNode
}
export default function Blockquote({
  className,
  children,
  ...props
}: BlockquoteProps) {
  return (
    <blockquote
      className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic text-gray-600 dark:text-gray-400 my-3"
      {...props}
    >
      {children}
    </blockquote>
  )
}
