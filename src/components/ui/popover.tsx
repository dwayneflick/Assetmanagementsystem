import * as React from "react"
import { createPopper } from "@popperjs/core@2.11.8"

const PopoverContext = React.createContext<{
  open: boolean
  setOpen: (open: boolean) => void
}>({
  open: false,
  setOpen: () => {},
})

interface PopoverProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

const Popover = ({ open: controlledOpen, onOpenChange, children }: PopoverProps) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
  
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen
  const setOpen = onOpenChange || setUncontrolledOpen

  return (
    <PopoverContext.Provider value={{ open, setOpen }}>
      {children}
    </PopoverContext.Provider>
  )
}

const PopoverTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ children, asChild, ...props }, ref) => {
  const { setOpen } = React.useContext(PopoverContext)

  const child = asChild ? children : <button {...props} ref={ref}>{children}</button>

  return React.cloneElement(child as React.ReactElement, {
    onClick: (e: React.MouseEvent) => {
      setOpen(true)
      const originalOnClick = (child as React.ReactElement).props.onClick
      if (originalOnClick) originalOnClick(e)
    },
  })
})
PopoverTrigger.displayName = "PopoverTrigger"

const PopoverContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { align?: "start" | "center" | "end" }
>(({ className, children, align = "center", ...props }, ref) => {
  const { open, setOpen } = React.useContext(PopoverContext)
  const triggerRef = React.useRef<HTMLElement | null>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)
  const popperInstanceRef = React.useRef<any>(null)

  React.useEffect(() => {
    if (!open) return

    const handleClickOutside = (event: MouseEvent) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open, setOpen])

  React.useEffect(() => {
    if (open && contentRef.current) {
      const trigger = contentRef.current.parentElement?.previousElementSibling as HTMLElement
      if (trigger) {
        triggerRef.current = trigger
        
        const placement = align === "end" ? "bottom-end" : align === "start" ? "bottom-start" : "bottom"
        
        popperInstanceRef.current = createPopper(trigger, contentRef.current, {
          placement,
          modifiers: [
            {
              name: "offset",
              options: {
                offset: [0, 8],
              },
            },
          ],
        })
      }
    }

    return () => {
      if (popperInstanceRef.current) {
        popperInstanceRef.current.destroy()
        popperInstanceRef.current = null
      }
    }
  }, [open, align])

  if (!open) return null

  return (
    <div
      ref={contentRef}
      className={`z-50 rounded-lg border bg-white shadow-lg ${className}`}
      {...props}
    >
      {children}
    </div>
  )
})
PopoverContent.displayName = "PopoverContent"

export { Popover, PopoverTrigger, PopoverContent }
