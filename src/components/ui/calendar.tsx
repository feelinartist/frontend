"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type CalendarProps = {
    readonly mode?: "single"
    readonly selected?: Date
    readonly onSelect?: (date: Date | undefined) => void
    readonly className?: string
    readonly initialFocus?: boolean
    readonly disabled?: (date: Date) => boolean
}

const DAYS = ["D", "L", "M", "M", "J", "V", "S"] // Domingo, Lunes, Martes, Miércoles, Jueves, Viernes, Sábado
const MONTHS = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]

function Calendar({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    mode = "single",
    selected,
    onSelect,
    className,
    ...props
}: CalendarProps) {
    // Initialize with selected date or current date
    // If selected is undefined, default to today for the view
    const [currentMonth, setCurrentMonth] = React.useState(selected || new Date())

    // Update currentMonth if selected date changes externally (optional, but good for UX)
    React.useEffect(() => {
        if (selected) {
            setCurrentMonth(selected)
        }
    }, [selected])

    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()

    // Generate year options (1970 to Current Year)
    const currentYear = new Date().getFullYear()
    const startYear = 1970
    const years = Array.from({ length: currentYear - startYear + 1 }, (_, i) => currentYear - i)

    // Get days in month
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDayOfMonth = new Date(year, month, 1).getDay() // 0 = Sunday

    // Generate calendar days
    const calendarDays: { id: string, value: number | null }[] = []

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDayOfMonth; i++) {
        calendarDays.push({ id: `empty-${i}`, value: null })
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
        calendarDays.push({ id: `day-${year}-${month}-${i}`, value: i })
    }

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(year, month - 1, 1))
    }

    const handleNextMonth = () => {
        setCurrentMonth(new Date(year, month + 1, 1))
    }

    const handleMonthChange = (value: string) => {
        setCurrentMonth(new Date(year, Number.parseInt(value), 1))
    }

    const handleYearChange = (value: string) => {
        setCurrentMonth(new Date(Number.parseInt(value), month, 1))
    }

    const handleDayClick = (day: number) => {
        const newDate = new Date(year, month, day)
        onSelect?.(newDate)
    }

    const isSelected = (day: number) => {
        if (!selected) return false
        return (
            selected.getDate() === day &&
            selected.getMonth() === month &&
            selected.getFullYear() === year
        )
    }

    const isToday = (day: number) => {
        const today = new Date()
        return (
            today.getDate() === day &&
            today.getMonth() === month &&
            today.getFullYear() === year
        )
    }

    const isDisabled = (day: number) => {
        if (!props.disabled) return false
        const dateToCheck = new Date(year, month, day)
        return props.disabled(dateToCheck)
    }

    return (
        <div className={cn("p-4", className)}>
            {/* Header with month/year selectors */}
            <div className="flex items-center justify-between mb-4 gap-2">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
                    onClick={handlePrevMonth}
                    type="button"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex gap-2 flex-1 justify-center">
                    <Select value={month.toString()} onValueChange={handleMonthChange}>
                        <SelectTrigger className="w-full h-8 bg-zinc-900 border-zinc-800 text-white focus:ring-0 focus:border-zinc-700">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white max-h-[300px]">
                            {MONTHS.map((monthName, index) => (
                                <SelectItem key={monthName} value={index.toString()}>
                                    {monthName}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={year.toString()} onValueChange={handleYearChange}>
                        <SelectTrigger className="w-full h-8 bg-zinc-900 border-zinc-800 text-white focus:ring-0 focus:border-zinc-700">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white max-h-[300px]">
                            {years.map((y) => (
                                <SelectItem key={y} value={y.toString()}>
                                    {y}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
                    onClick={handleNextMonth}
                    type="button"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            {/* Calendar grid */}
            <div className="w-full">
                {/* Day headers */}
                <div className="grid grid-cols-7 mb-2">
                    {DAYS.map((day, index) => (
                        <div
                            key={`day-header-${index}-${day}`}
                            className="h-9 flex items-center justify-center text-xs font-medium text-zinc-500"
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days grid */}
                <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((dayObj) => {
                        const day = dayObj.value
                        const disabled = day ? isDisabled(day) : false
                        return (
                            <div key={dayObj.id} className="h-9 flex items-center justify-center">
                                {day ? (
                                    <button
                                        type="button"
                                        onClick={() => !disabled && handleDayClick(day)}
                                        disabled={disabled}
                                        className={cn(
                                            "h-8 w-8 rounded-full flex items-center justify-center text-sm transition-all",
                                            disabled ? "text-zinc-700 opacity-50 cursor-not-allowed" : "hover:bg-zinc-800 hover:text-white",
                                            isSelected(day) && !disabled && "bg-white text-black font-bold hover:bg-white hover:text-black shadow-md scale-105",
                                            isToday(day) && !isSelected(day) && !disabled && "bg-zinc-800 text-white",
                                            !isSelected(day) && !isToday(day) && !disabled && "text-zinc-300"
                                        )}
                                    >
                                        {day}
                                    </button>
                                ) : (
                                    <div className="h-8 w-8" />
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

Calendar.displayName = "Calendar"

export { Calendar }
