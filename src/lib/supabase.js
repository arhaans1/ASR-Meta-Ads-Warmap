import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createSupabaseClient(supabaseUrl || '', supabaseKey || '')

// Client operations
export async function getClients() {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })
  return { data, error }
}

export async function getClient(id) {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()
  return { data, error }
}

export async function createClient(client) {
  const { data, error } = await supabase
    .from('clients')
    .insert(client)
    .select()
    .single()
  return { data, error }
}

export async function updateClient(id, updates) {
  const { data, error } = await supabase
    .from('clients')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

export async function deleteClient(id) {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id)
  return { error }
}

export async function searchClients(query) {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .ilike('name', `%${query}%`)
    .order('created_at', { ascending: false })
  return { data, error }
}

// Warmap operations
export async function getWarmaps() {
  const { data, error } = await supabase
    .from('warmaps')
    .select('*')
    .order('created_at', { ascending: false })
  return { data, error }
}

export async function getWarmap(id) {
  const { data, error } = await supabase
    .from('warmaps')
    .select('*')
    .eq('id', id)
    .single()
  return { data, error }
}

export async function getWarmapsByClient(clientId) {
  const { data, error } = await supabase
    .from('warmaps')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
  return { data, error }
}

export async function createWarmap(warmap) {
  const { data, error } = await supabase
    .from('warmaps')
    .insert(warmap)
    .select()
    .single()
  return { data, error }
}

export async function updateWarmap(id, updates) {
  const { data, error } = await supabase
    .from('warmaps')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

export async function deleteWarmap(id) {
  const { error } = await supabase
    .from('warmaps')
    .delete()
    .eq('id', id)
  return { error }
}

export async function searchWarmaps(query) {
  const { data, error } = await supabase
    .from('warmaps')
    .select('*')
    .or(`client_name.ilike.%${query}%,business_name.ilike.%${query}%`)
    .order('created_at', { ascending: false })
  return { data, error }
}
