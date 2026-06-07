import { createClient } from '@/lib/supabase-server'
import JournalClient from '@/components/JournalClient'

export default async function JournalPage() {
  const supabase = await createClient()

  const { data: records } = await supabase
    .from('records')
    .select(`
      id, title, city, country, start_date, end_date,
      cover_photo_url, tags, description,
      photos(id, url, display_order)
    `)
    .order('start_date', { ascending: false, nullsFirst: false })

  return <JournalClient records={records || []} />
}