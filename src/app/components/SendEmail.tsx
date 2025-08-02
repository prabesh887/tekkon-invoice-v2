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

const schema = z.object({
  month: z.enum(months, { required_error: "Please select a month." }),
})
type FormValues = z.infer<typeof schema>

interface SendEmailProps {
  onMonthSelect: (month: string) => void
  disabled?: boolean
}

export default function SendEmail({
  onMonthSelect,
  disabled = false,
}: SendEmailProps) {
  const now = new Date()
  const defaultMonth = months[(now.getMonth() + 11) % 12]

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { month: defaultMonth },
    mode: "onBlur",
  })

  const handleSubmit = (data: FormValues) => {
    onMonthSelect(data.month)
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex justify-between items-end gap-10"
      >
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
