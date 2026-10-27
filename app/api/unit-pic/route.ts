import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requirePermission } from '@/lib/server-auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Changing who is PIC of which unit is part of Pengguna → Unit PIC (manage_roles)
const guardWrite = (request: Request) =>
  requirePermission(request, { resource: 'pengguna', action: 'manage_roles' }, ['semua', 'Super Admin', 'admin'])

// GET - Fetch all unit-pic mappings
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') // 'raw' or 'formatted'

    const { data, error } = await supabase
      .from('unit_pic')
      .select('*')
      .order('unit', { ascending: true })

    if (error) throw error

    const unitPics = data || []

    // If format=raw, return raw array (for UnitPicManager)
    if (format === 'raw') {
      return NextResponse.json(unitPics)
    }

    // Default: return formatted data for Surat page compatibility
    // Extract unique units and create unitPicMap. Every unit is listed, but a
    // disabled PIC is left out of the map so the Surat form does not offer them.
    const units = Array.from(new Set(unitPics.map(item => item.unit)))
    const unitPicMap: Record<string, string[]> = {}
    
    unitPics.filter(item => item.is_active !== false).forEach(item => {
      if (!unitPicMap[item.unit]) {
        unitPicMap[item.unit] = []
      }
      if (!unitPicMap[item.unit].includes(item.pic)) {
        unitPicMap[item.unit].push(item.pic)
      }
    })

    return NextResponse.json({ units, unitPicMap })
  } catch (error: any) {
    console.error('Error fetching unit-pic data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch unit-pic data', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create new unit-pic mapping
export async function POST(request: Request) {
  const guard = await guardWrite(request)
  if (guard.denied) return guard.denied
  try {
    const body = await request.json()
    const { unit, pic } = body

    // Validation
    if (!unit || !pic) {
      return NextResponse.json(
        { error: 'Unit and PIC are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('unit_pic')
      .insert([{ unit, pic }])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error('Error creating unit-pic:', error)
    return NextResponse.json(
      { error: 'Failed to create unit-pic', details: error.message },
      { status: 500 }
    )
  }
}

// PATCH - Update existing unit-pic mapping, or { pic, isActive } to disable / enable a PIC in every unit
export async function PATCH(request: Request) {
  const guard = await guardWrite(request)
  if (guard.denied) return guard.denied
  try {
    const body = await request.json()
    const { id, unit, pic } = body

    if (!id && typeof body.isActive === 'boolean') {
      if (!pic) {
        return NextResponse.json({ error: 'PIC diperlukan' }, { status: 400 })
      }
      const { data, error } = await supabase
        .from('unit_pic')
        .update({ is_active: body.isActive, disabled_at: body.isActive ? null : new Date().toISOString() })
        .eq('pic', pic)
        .select('id')
      if (error) throw error
      return NextResponse.json({ pic, isActive: body.isActive, updated: data?.length || 0 })
    }

    // Validation
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      )
    }

    if (!unit && !pic) {
      return NextResponse.json(
        { error: 'At least one field (unit or pic) must be provided' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (unit) updateData.unit = unit
    if (pic) updateData.pic = pic

    const { data, error } = await supabase
      .from('unit_pic')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error updating unit-pic:', error)
    return NextResponse.json(
      { error: 'Failed to update unit-pic', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete one mapping (?id=) or every unit of a PIC (?pic=)
export async function DELETE(request: Request) {
  const guard = await guardWrite(request)
  if (guard.denied) return guard.denied
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const pic = searchParams.get('pic')

    if (!id && !pic) {
      return NextResponse.json(
        { error: 'ID or PIC is required' },
        { status: 400 }
      )
    }

    const query = supabase.from('unit_pic').delete()
    const { error } = id ? await query.eq('id', id) : await query.eq('pic', pic as string)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting unit-pic:', error)
    return NextResponse.json(
      { error: 'Failed to delete unit-pic', details: error.message },
      { status: 500 }
    )
  }
}

// PUT - Set every unit of one PIC in one go: { pic, units: string[], previousPic? }
// Missing pairs are inserted first and extra rows (including duplicates) removed after,
// so a failure part-way never leaves the PIC with fewer units than before.
// previousPic renames: that PIC's rows are replaced by rows for `pic`.
export async function PUT(request: Request) {
  const guard = await guardWrite(request)
  if (guard.denied) return guard.denied
  try {
    const body = await request.json()
    const pic = typeof body.pic === 'string' ? body.pic.trim() : ''
    const previousPic = typeof body.previousPic === 'string' ? body.previousPic.trim() : ''
    const units: string[] = Array.isArray(body.units)
      ? Array.from(new Set(body.units.map((u: unknown) => String(u).trim()).filter(Boolean)))
      : []

    if (!pic) {
      return NextResponse.json({ error: 'PIC diperlukan' }, { status: 400 })
    }
    if (units.length === 0) {
      return NextResponse.json({ error: 'Pilih sekurang-kurangnya satu unit' }, { status: 400 })
    }

    const owners = Array.from(new Set([pic, previousPic].filter(Boolean)))
    const { data: existing, error: readError } = await supabase.from('unit_pic').select('*').in('pic', owners)
    if (readError) throw readError

    const kept = new Set<string>()
    const keepIds = new Set<string>()
    for (const row of existing || []) {
      if (row.pic === pic && units.includes(row.unit) && !kept.has(row.unit)) {
        kept.add(row.unit)
        keepIds.add(row.id)
      }
    }

    // New unit rows take the PIC's status, so a disabled PIC stays disabled in every unit
    const isActive = (existing || []).length === 0 || (existing || []).some((row) => row.is_active !== false)
    const toInsert = units.filter((unit) => !kept.has(unit)).map((unit) => ({ unit, pic, is_active: isActive }))
    if (toInsert.length > 0) {
      const { error: insertError } = await supabase.from('unit_pic').insert(toInsert)
      if (insertError) throw insertError
    }

    const toDelete = (existing || []).filter((row) => !keepIds.has(row.id)).map((row) => row.id)
    if (toDelete.length > 0) {
      const { error: deleteError } = await supabase.from('unit_pic').delete().in('id', toDelete)
      if (deleteError) throw deleteError
    }

    return NextResponse.json({ pic, units, added: toInsert.length, removed: toDelete.length })
  } catch (error: any) {
    console.error('Error setting unit-pic:', error)
    return NextResponse.json(
      { error: 'Gagal menyimpan unit PIC', details: error.message },
      { status: 500 }
    )
  }
}
