import * as React from 'react'
import { CalendarDays, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  value: number
  onChange: (days: number) => void
  className?: string
}

const PRESETS = [
  { label: '7 Days', value: 7 },
  { label: '14 Days', value: 14 },
  { label: '30 Days', value: 30 },
  { label: '3 Months', value: 90 },
  { label: '1 Year', value: 365 },
]

export function DaysRangePicker({ value, onChange, className }: Props) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [customValue, setCustomValue] = React.useState(value.toString())

  React.useEffect(() => {
    setCustomValue(value.toString())
  }, [value])

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setCustomValue(val)
    const num = parseInt(val)
    if (!isNaN(num) && num > 0) onChange(num)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'justify-start text-left font-normal',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <CalendarDays className="mr-2 h-4 w-4" />
          {value ? `Last ${value} days` : 'Select range'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4" align="end">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Presets</h4>
            <p className="text-xs text-muted-foreground">
              Quickly switch timeframes.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {PRESETS.map((preset) => (
              <Button
                key={preset.value}
                variant={value === preset.value ? 'default' : 'outline'}
                className="h-8 text-xs"
                onClick={() => {
                  onChange(preset.value)
                  setIsOpen(false)
                }}
              >
                {value === preset.value && <Check className="mr-1 h-3 w-3" />}
                {preset.label}
              </Button>
            ))}
          </div>
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Custom</h4>
            <div className="flex items-center gap-2">
              <Label htmlFor="custom-days" className="text-xs w-12">
                Days:
              </Label>
              <Input
                id="custom-days"
                value={customValue}
                onChange={handleCustomChange}
                className="h-8"
                type="number"
                min="1"
                placeholder="e.g. 45"
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
