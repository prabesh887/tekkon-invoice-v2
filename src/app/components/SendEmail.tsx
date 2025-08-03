"use client"

import React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 5 }, (_, i) =>
  (currentYear - 2 + i).toString()
)

const schema = z.object({
  month: z.enum(months, { required_error: "Please select a month." }),
  year: z.string({ required_error: "Please select a year." }),
})
type FormValues = z.infer<typeof schema>

interface SendEmailProps {
  onMonthSelect: (month: string, year: string) => void
  disabled?: boolean
}

export default function SendEmail({
  onMonthSelect,
  disabled = false,
}: SendEmailProps) {
  const now = new Date()
  const defaultMonth = months[(now.getMonth() + 11) % 12]
  const defaultYear = now.getFullYear().toString()
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { month: defaultMonth, year: defaultYear },
    mode: "onBlur",
  })

  const handleSubmit = (data: FormValues) => {
    onMonthSelect(data.month, data.year)
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex justify-between items-end gap-10"
      >
        {/* Month Field */}
        <FormField
          control={form.control}
          name="month"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">Salary for Month:</FormLabel>
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={disabled}
                >
                  <SelectTrigger className="w-[240px]">
                    <SelectValue placeholder="Select a month" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Year Field */}
        <FormField
          control={form.control}
          name="year"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">Salary for Year:</FormLabel>
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={disabled}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Select a year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y} value={y}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          size="lg"
          disabled={disabled || !form.formState.isValid}
        >
          Send Emails
        </Button>
      </form>
    </Form>
  )
}
