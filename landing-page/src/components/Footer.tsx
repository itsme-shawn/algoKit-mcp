export default function Footer() {
  return (
    <footer className="py-16 pb-8 border-t border-border-subtle">
      <div className="max-w-[960px] mx-auto px-8 max-[720px]:px-5">
        <div className="flex justify-between items-start flex-wrap gap-8 max-[720px]:flex-col">
          <div className="font-display text-[13px] text-text-muted">
            algokit-mcp
          </div>
          <ul className="flex gap-8 list-none">
            <li>
              <a
                href="https://github.com/itsme-shawn/AlgoKit-mcp"
                target="_blank"
                rel="noopener"
                className="text-[13px] text-text-muted hover:text-text-secondary transition-colors duration-200"
              >
                GitHub
              </a>
            </li>
            <li>
              <a
                href="https://www.npmjs.com/package/algokit-mcp"
                target="_blank"
                rel="noopener"
                className="text-[13px] text-text-muted hover:text-text-secondary transition-colors duration-200"
              >
                npm
              </a>
            </li>
            <li>
              <a
                href="https://github.com/itsme-shawn/AlgoKit-mcp/issues"
                target="_blank"
                rel="noopener"
                className="text-[13px] text-text-muted hover:text-text-secondary transition-colors duration-200"
              >
                Issues
              </a>
            </li>
          </ul>
          <p className="w-full mt-8 text-xs text-text-muted">MIT License</p>
        </div>
      </div>
    </footer>
  )
}
