import * as React from "react"
import { Check, ChevronsUpDown, Loader2, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { toast } from "sonner"

interface AddressAutocompleteProps {
    value?: string
    onChange: (value: string) => void
    placeholder?: string
    className?: string
}

interface Suggestion {
    place_id: number
    display_name: string
    lat: string
    lon: string
}

export function AddressAutocomplete({
    value,
    onChange,
    placeholder = "Search address...",
    className,
}: AddressAutocompleteProps) {
    const [open, setOpen] = React.useState(false)
    const [inputValue, setInputValue] = React.useState(value || "")
    const [suggestions, setSuggestions] = React.useState<Suggestion[]>([])
    const [loading, setLoading] = React.useState(false)

    // Update input value when prop changes
    React.useEffect(() => {
        if (value !== inputValue) {
            setInputValue(value || "")
        }
    }, [value])

    const fetchSuggestions = async (query: string) => {
        if (!query || query.length < 3) {
            setSuggestions([])
            return
        }

        setLoading(true)
        try {
            // Use Nominatim (OpenStreetMap)
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                    query
                )}&addressdetails=1&limit=5`,
                {
                    headers: {
                        "Accept-Language": "en-US,en;q=0.9",
                    },
                }
            )

            if (!response.ok) throw new Error("Failed to fetch address suggestions")

            const data = await response.json()
            setSuggestions(data)
        } catch (error) {
            console.error("Address fetch error:", error)
            toast.error("Failed to load address suggestions")
        } finally {
            setLoading(false)
        }
    }

    // Debounce search
    React.useEffect(() => {
        const timer = setTimeout(() => {
            if (inputValue && open) {
                fetchSuggestions(inputValue)
            }
        }, 500)

        return () => clearTimeout(timer)
    }, [inputValue, open])

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between font-normal text-left", !value && "text-muted-foreground", className)}
                >
                    <span className="truncate">
                        {value || placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder={placeholder}
                        value={inputValue}
                        onValueChange={setInputValue}
                    />
                    <CommandList>
                        <CommandEmpty>
                            {loading ? (
                                <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Searching...
                                </div>
                            ) : (
                                "No address found."
                            )}
                        </CommandEmpty>
                        <CommandGroup>
                            {suggestions.map((suggestion) => (
                                <CommandItem
                                    key={suggestion.place_id}
                                    value={suggestion.display_name}
                                    onSelect={(currentValue) => {
                                        onChange(currentValue)
                                        setInputValue(currentValue)
                                        setOpen(false)
                                    }}
                                    className="cursor-pointer"
                                >
                                    <MapPin className="mr-2 h-4 w-4 shrink-0 opacity-70" />
                                    <span className="truncate">{suggestion.display_name}</span>
                                    <Check
                                        className={cn(
                                            "ml-auto h-4 w-4",
                                            value === suggestion.display_name ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
