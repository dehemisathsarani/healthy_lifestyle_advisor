import React, { useState } from 'react'

interface SelectProps {
  children: React.ReactNode
  onValueChange?: (value: string) => void
  defaultValue?: string
  value?: string
  required?: boolean
  disabled?: boolean
}



interface SelectContentProps {
  children: React.ReactNode
  className?: string
}

interface SelectItemProps {
  children: React.ReactNode
  value: string
  className?: string
}

interface SelectValueProps {
  placeholder?: string
  className?: string
}

const SelectContext = React.createContext<{
  value: string
  onValueChange: (value: string) => void
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}>({
  value: '',
  onValueChange: () => {},
  isOpen: false,
  setIsOpen: () => {}
})

export function Select({ children, onValueChange, defaultValue = '', value: controlledValue, required, disabled }: SelectProps) {
  const [internalValue, setInternalValue] = useState(defaultValue)
  const [isOpen, setIsOpen] = useState(false)
  
  const value = controlledValue !== undefined ? controlledValue : internalValue
  
  const handleValueChange = (newValue: string) => {
    if (controlledValue === undefined) {
      setInternalValue(newValue)
    }
    onValueChange?.(newValue)
    setIsOpen(false)
  }
  
  return (
    <SelectContext.Provider value={{ value, onValueChange: handleValueChange, isOpen, setIsOpen }}>
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  )
}

interface SelectTriggerProps {
  children: React.ReactNode
  className?: string
  disabled?: boolean
}

export function SelectTrigger({ children, className = '', disabled = false }: SelectTriggerProps) {
  const { isOpen, setIsOpen } = React.useContext(SelectContext)
  
  return (
    <button
      type="button"
      disabled={disabled}
      className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      onClick={() => !disabled && setIsOpen(!isOpen)}
    >
      {children}
      <svg
        className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  )
}

export function SelectContent({ children, className = '' }: SelectContentProps) {
  const { isOpen } = React.useContext(SelectContext)
  
  if (!isOpen) return null
  
  return (
    <div className={`absolute top-full left-0 z-50 mt-1 w-full rounded-md border border-gray-300 bg-white shadow-lg ${className}`}>
      <div className="max-h-60 overflow-auto py-1">
        {children}
      </div>
    </div>
  )
}

export function SelectItem({ children, value, className = '' }: SelectItemProps) {
  const { onValueChange } = React.useContext(SelectContext)
  
  return (
    <div
      className={`cursor-pointer px-3 py-2 text-sm hover:bg-gray-100 ${className}`}
      onClick={() => onValueChange(value)}
    >
      {children}
    </div>
  )
}

export function SelectValue({ placeholder = 'Select...', className = '' }: SelectValueProps) {
  const { value } = React.useContext(SelectContext)
  
  return (
    <span className={className}>
      {value || placeholder}
    </span>
  )
}
