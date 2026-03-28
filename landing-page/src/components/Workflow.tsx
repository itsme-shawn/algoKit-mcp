import { useState, useCallback } from 'react'
import { useReveal } from '../hooks/useReveal'
import SectionHeader from './SectionHeader'
import AnimatedTerminal from './AnimatedTerminal'
import ReviewAccordion from './ReviewAccordion'
import { workflowSteps } from '../data/workflow-steps'

export default function Workflow() {
  const [active, setActive] = useState(0)
  const [showReview, setShowReview] = useState(false)
  const revealRef = useReveal()

  const handleTabClick = useCallback((idx: number) => {
    setActive(idx)
    setShowReview(false)
  }, [])

  const handleTerminalDone = useCallback(() => {
    if (active === 5) {
      setShowReview(true)
    }
  }, [active])

  const step = workflowSteps[active]

  return (
    <>
      <hr className="border-0 border-t border-border-subtle m-0" />
      <section id="workflow" className="py-24 max-[720px]:py-16">
        <div className="max-w-[960px] mx-auto px-8 max-[720px]:px-5">
          <SectionHeader
            label="Workflow"
            title="하나의 문제, 처음부터 끝까지"
            desc={'문제 탐색부터 복습까지 6단계로 AI와 함께 체계적으로 학습합니다.'}
          />

          <div ref={revealRef} className="reveal">
            {/* Step navigation — numbered pills */}
            <nav className="flex gap-2 mb-8 overflow-x-auto scrollbar-hide max-[720px]:gap-1" role="tablist">
              {workflowSteps.map((s, i) => (
                <button
                  key={i}
                  role="tab"
                  aria-selected={i === active}
                  onClick={() => handleTabClick(i)}
                  className={`group flex items-center gap-2 py-2 px-3.5 rounded-sm whitespace-nowrap cursor-pointer transition-all duration-200 border max-[720px]:px-2.5 ${
                    i === active
                      ? 'bg-accent/10 border-accent/30 text-accent'
                      : 'bg-transparent border-border-subtle text-text-muted hover:text-text-secondary hover:border-border-medium hover:bg-bg-raised/50'
                  }`}
                >
                  <span className={`font-mono text-[10px] font-bold leading-none w-[18px] h-[18px] flex items-center justify-center rounded-full shrink-0 transition-colors duration-200 ${
                    i === active
                      ? 'bg-accent text-bg-primary'
                      : 'bg-border-subtle text-text-muted group-hover:bg-border-medium'
                  }`}>
                    {s.icon}
                  </span>
                  <span className="text-[12px] font-medium max-[720px]:text-[11px]">{s.label}</span>
                </button>
              ))}
            </nav>

            <p className="font-mono text-[11px] text-text-muted mb-4 pl-0.5">
              {step.meta}
            </p>

            <AnimatedTerminal
              title={step.terminalTitle}
              userText={step.userText}
              agentContent={step.agentContent}
              skillHint={step.skillHint}
              animKey={active}
              onDone={handleTerminalDone}
            />

            {active === 5 && showReview && (
              <div className="animate-[fadeSlideIn_0.4s_ease-out]">
                <p className="font-mono text-[11px] text-text-muted mt-6 mb-2 pl-0.5">
                  생성된 복습 문서
                </p>
                <ReviewAccordion />
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
