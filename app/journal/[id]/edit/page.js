import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import EditClient from '@/components/EditClient'

export default async function EditPage({ params }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: record, error } = await supabase
    .from('records')
    .select(`
      id, title, city, country, start_date, end_date,
      cover_photo_url, tags, description, companions, weather,
      photos(id, url, cloudinary_id, display_order)
    `)
    .eq('id', id)
    .single()

  if (error || !record) notFound()
  record.photos = (record.photos || []).sort((a, b) => a.display_order - b.display_order)

  return <EditClient record={record} />
}