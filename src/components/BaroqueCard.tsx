import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { OrnamentalBorder, OrnamentalDivider } from "@/components/OrnamentalBorder"
import { Separator } from "@/components/ui/separator"

// Animation constants suitable for the "regal" feel
const FADE_IN_VARIANTS = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
}

const STAGGER_CONTAINER = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2, // Stagger delays for children
      delayChildren: 0.1
    }
  }
}

interface BaroqueCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  /**
   * If true, applies a standard entrance animation to the card content
   */
  animate?: boolean
}

const BaroqueCard = React.forwardRef<HTMLDivElement, BaroqueCardProps>(
  ({ children, className, animate = true, ...props }, ref) => {
    const Wrapper = animate ? motion.div : "div"
    const wrapperProps = animate ? {
      initial: "hidden",
      whileInView: "visible",
      viewport: { once: true, margin: "-50px" },
      variants: STAGGER_CONTAINER
    } : {}

    return (
      <OrnamentalBorder className={cn("w-full", className)}>
        {/* @ts-ignore */}
        <Wrapper
          ref={ref}
          className="flex flex-col h-full gap-6 relative"
          {...wrapperProps}
          {...props}
        >
          {children}
        </Wrapper>
      </OrnamentalBorder>
    )
  }
)
BaroqueCard.displayName = "BaroqueCard"

/* -------------------------------------------------------------------------- */
/*                                   Header                                   */
/* -------------------------------------------------------------------------- */

interface BaroqueCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Whether to show the ornamental divider below the header automatically.
   * Default: true
   */
  withDivider?: boolean
}

const BaroqueCardHeader = React.forwardRef<HTMLDivElement, BaroqueCardHeaderProps>(
  ({ className, children, withDivider = true, ...props }, ref) => {
    return (
      <motion.div 
        ref={ref} 
        variants={FADE_IN_VARIANTS}
        className={cn("flex flex-col space-y-2 text-center items-center p-2", className)} 
        {...props}
      >
        {children}
        {withDivider && <OrnamentalDivider className="w-full mt-4 mb-2 opacity-80" />}
      </motion.div>
    )
  }
)
BaroqueCardHeader.displayName = "BaroqueCardHeader"

/* -------------------------------------------------------------------------- */
/*                                   Title                                    */
/* -------------------------------------------------------------------------- */

const BaroqueCardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn(
          "font-serif text-2xl md:text-3xl lg:text-4xl uppercase tracking-[0.15em] text-foreground leading-none",
          className
        )}
        {...props}
      >
        {children}
      </h3>
    )
  }
)
BaroqueCardTitle.displayName = "BaroqueCardTitle"

/* -------------------------------------------------------------------------- */
/*                                  Subtitle                                  */
/* -------------------------------------------------------------------------- */

const BaroqueCardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn("text-muted-foreground text-sm md:text-base font-medium italic tracking-wide max-w-[80%]", className)}
        {...props}
      />
    )
  }
)
BaroqueCardDescription.displayName = "BaroqueCardDescription"

/* -------------------------------------------------------------------------- */
/*                                  Content                                   */
/* -------------------------------------------------------------------------- */

const BaroqueCardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <motion.div 
        ref={ref} 
        variants={FADE_IN_VARIANTS} 
        className={cn("flex-1 text-center font-sans space-y-4 px-2 md:px-4", className)} 
        {...props} 
      />
    )
  }
)
BaroqueCardContent.displayName = "BaroqueCardContent"

/* -------------------------------------------------------------------------- */
/*                                  Footer                                    */
/* -------------------------------------------------------------------------- */

interface BaroqueCardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  centered?: boolean
}

const BaroqueCardFooter = React.forwardRef<HTMLDivElement, BaroqueCardFooterProps>(
  ({ className, centered = true, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        variants={FADE_IN_VARIANTS}
        className={cn(
          "flex items-center pt-4", 
          centered ? "justify-center" : "justify-between",
          className
        )}
        {...props}
      />
    )
  }
)
BaroqueCardFooter.displayName = "BaroqueCardFooter"

export {
  BaroqueCard,
  BaroqueCardHeader,
  BaroqueCardTitle,
  BaroqueCardDescription,
  BaroqueCardContent,
  BaroqueCardFooter,
}
