import * as React from "react"
import PhoneInput from "react-phone-number-input"
import "react-phone-number-input/style.css"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

import flags from "react-phone-number-input/flags"

interface PhoneInputProps {
    value?: string
    onChange: (value?: string) => void
    placeholder?: string
    className?: string
    disabled?: boolean
    error?: boolean
}

export function PhoneNumberInput({
    value,
    onChange,
    placeholder = "Enter phone number",
    className,
    disabled,
    error
}: PhoneInputProps) {
    return (
        <div className={cn("flex", className)}>
            <PhoneInput
                international
                defaultCountry="BE"
                flags={flags}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
                className={cn(
                    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    error && "border-red-500",
                    "[&_.PhoneInputCountry]:mr-2 [&_.PhoneInputCountryIcon]:h-4 [&_.PhoneInputCountryIcon]:w-6 [&_.PhoneInputCountrySelect]:h-full [&_.PhoneInputCountrySelect]:w-full [&_.PhoneInputCountrySelect]:opacity-0 [&Input]:h-full [&Input]:w-full [&Input]:bg-transparent [&Input]:outline-none [&Input]:border-none"
                )}
                numberInputProps={{
                    className: "flex h-full w-full rounded-md bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                }}
            />
        </div>
    )
}
