import { NextRequest, NextResponse } from 'next/server'
import { getMockElectionData } from '@/lib/mock/mapData'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const electionId = searchParams.get('electionId') ?? ''

  try {
    // Future: Prisma query here
    // const results = await prisma.electionResult.findMany({ where: { electionId } })
    // if (results.length > 0) return NextResponse.json(formatResults(results))

    // Fallback to mock data
    return NextResponse.json(getMockElectionData(electionId))
  } catch {
    // Always return data — never leave the user with an empty map
    return NextResponse.json(getMockElectionData(electionId))
  }
}
