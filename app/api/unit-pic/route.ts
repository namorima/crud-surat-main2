import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

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
    // Extract unique units and create unitPicMap
    const units = Array.from(new Set(unitPics.map(item => item.unit)))
    const unitPicMap: Record<string, string[]> = {}
    
    unitPics.forEach(item => {
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

// PATCH - Update existing unit-pic mapping
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, unit, pic } = body

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

// DELETE - Delete unit-pic mapping
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('unit_pic')
      .delete()
      .eq('id', id)

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
