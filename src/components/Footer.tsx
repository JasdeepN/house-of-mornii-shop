export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/20">
      <div className="container mx-auto px-6 lg:px-20 py-12">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="text-xl">
              <span className="font-bold tracking-wider">HOUSE</span>
              <span className="font-script text-2xl ml-2">Mornii</span>
            </div>
          </div>

          <p className="text-sm text-muted-foreground tracking-[0.15em]">
            REGAL · RADIANT · MODERN
          </p>

          <div className="pt-6 border-t border-border max-w-2xl mx-auto">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} House of Mornii. All rights reserved.
              <br />
              Heritage-inspired costume jewellery for life's most precious moments.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
