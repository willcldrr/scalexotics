"use client"

import { useCurrency } from "@/lib/currency-context"
import { SUPPORTED_CURRENCIES } from "@/lib/currency"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function CurrencySelector() {
  const { currency, setCurrency } = useCurrency()

  return (
    <Select value={currency} onValueChange={setCurrency}>
      <SelectTrigger className="w-[140px]" size="sm">
        <SelectValue placeholder="Currency" />
      </SelectTrigger>
      <SelectContent>
        {Object.values(SUPPORTED_CURRENCIES).map((info) => (
          <SelectItem key={info.code} value={info.code}>
            {info.symbol} {info.code}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
