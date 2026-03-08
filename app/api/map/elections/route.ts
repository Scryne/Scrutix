import { NextResponse } from 'next/server'
import { getMockElectionList } from '@/lib/mock/mapData'

export async function GET() {
  try {
    // Future: Prisma query here
    // const elections = await prisma.election.findMany(...)
    // if (elections.length > 0) return NextResponse.json(elections)

    // Fallback to mock data
    return NextResponse.json(getMockElectionList())
  } catch {
    // Always return data — never leave the user with an empty map
    return NextResponse.json(getMockElectionList())
  }
}
