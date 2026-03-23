import { ChevronLeft, ChevronRight } from 'lucide-react'

type SideRailPagerProps = {
  label: string
  currentPage: number
  totalPages: number
  onPrevious: () => void
  onNext: () => void
}

export function SideRailPager({
  label,
  currentPage,
  totalPages,
  onPrevious,
  onNext,
}: SideRailPagerProps) {
  const previousDisabled = currentPage <= 1
  const nextDisabled = currentPage >= totalPages

  return (
    <nav className="panel-pager" aria-label={`Sider for ${label}`}>
      <button
        type="button"
        className="panel-pager__button"
        onClick={onPrevious}
        disabled={previousDisabled}
        aria-label={`Forrige side i ${label}`}
      >
        <ChevronLeft size={15} strokeWidth={2.2} aria-hidden="true" />
      </button>
      <span className="panel-pager__status" aria-label={`Side ${currentPage} av ${totalPages}`}>
        {currentPage} / {totalPages}
      </span>
      <button
        type="button"
        className="panel-pager__button"
        onClick={onNext}
        disabled={nextDisabled}
        aria-label={`Neste side i ${label}`}
      >
        <ChevronRight size={15} strokeWidth={2.2} aria-hidden="true" />
      </button>
    </nav>
  )
}
