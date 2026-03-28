import { useReveal } from '../hooks/useReveal'

interface SectionHeaderProps {
  label: string
  title: string
  desc: React.ReactNode
}

export default function SectionHeader({ label, title, desc }: SectionHeaderProps) {
  const labelRef = useReveal()
  const titleRef = useReveal()
  const descRef = useReveal()

  return (
    <>
      <p
        ref={labelRef}
        className="reveal font-display text-[11px] text-text-muted tracking-[0.1em] uppercase mb-2"
      >
        {label}
      </p>
      <h2
        ref={titleRef}
        className="reveal text-[clamp(22px,3.5vw,32px)] font-bold tracking-[-0.02em] mb-4 leading-[1.3]"
      >
        {title}
      </h2>
      <p
        ref={descRef}
        className="reveal text-text-secondary max-w-[560px] mb-12 text-[15px]"
      >
        {desc}
      </p>
    </>
  )
}
