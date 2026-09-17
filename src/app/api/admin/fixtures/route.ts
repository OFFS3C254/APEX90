import { NextRequest, NextResponse } from "next/server";
import { getFixturesForDate } from "@/lib/sportsApi";
import { getAdminSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

  try {
    const fixtures = await getFixturesForDate(date);
    return NextResponse.json({
      success: true,
      date,
      count: fixtures.length,
      fixtures,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
