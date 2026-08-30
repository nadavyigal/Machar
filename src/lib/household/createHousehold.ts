import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

export const HouseholdInput = z.object({
  displayName: z.string().min(1),
  adults: z.array(z.object({ firstName: z.string().min(1) })).min(1),
  children: z.array(z.object({
    firstName: z.string().min(1),
    birthYear: z.number().int().min(2005).max(2030),
    institutionId: z.string().uuid(),
    classRef: z.string().nullable(),
  })),
})

export type HouseholdInput = z.infer<typeof HouseholdInput>

export async function createHousehold(
  client: SupabaseClient,
  input: HouseholdInput,
): Promise<{ householdId: string }> {
  const parsed = HouseholdInput.parse(input)

  const { data, error } = await client.rpc('create_household', {
    p_display_name: parsed.displayName,
    p_adults: parsed.adults,
    p_children: parsed.children,
  })
  if (error) throw new Error(error.message)

  return { householdId: data as string }
}
