import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-error";
import { paginationSchema, createElectionSchema } from "@/lib/validators";
import { slugify } from "@/lib/utils";
import { rateLimit } from '@/lib/rate-limit';
import { auth } from "@/auth";

/**
 * GET /api/elections
 * Fetch paginated elections with optional filters.
 * Soft-deleted records are excluded by default.
 */
export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const { success } = await rateLimit.limit(ip);
    if (!success) {
      return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);

    const { page, limit } = paginationSchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
    });

    const status = searchParams.get("status") ?? undefined;
    const type = searchParams.get("type") ?? undefined;
    const country = searchParams.get("country") ?? undefined;
    const search = searchParams.get("search") ?? undefined;
    const regionId = searchParams.get("regionId") ?? undefined;
    const sortBy = searchParams.get("sortBy") ?? "date";
    const sortOrder = (searchParams.get("sortOrder") ?? "desc") as "asc" | "desc";

    const where = {
      isDeleted: false,
      ...(status && { status: status as never }),
      ...(type && { type: type as never }),
      ...(country && { country }),
      ...(regionId && { regionId }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    };

    const [elections, total] = await Promise.all([
      prisma.election.findMany({
        where,
        include: {
          region: true,
          _count: {
            select: {
              candidates: true,
              pollResults: true,
              predictions: true,
              comments: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.election.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: elections,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/elections
 * Create a new election. Requires ADMIN authentication.
 */
export async function POST(request: NextRequest) {
  try {
    // Auth guard — only ADMIN can create elections
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: { message: "Unauthorized", code: "UNAUTHORIZED" } },
        { status: 401 }
      );
    }

    const body: unknown = await request.json();
    const data = createElectionSchema.parse(body);

    const slug = data.slug || slugify(data.title);

    const election = await prisma.election.create({
      data: {
        ...data,
        slug,
      },
      include: {
        region: true,
        candidates: { include: { party: true } },
        pollResults: { include: { pollFirm: true, party: true, candidate: true } },
      },
    });

    return NextResponse.json({ data: election }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
