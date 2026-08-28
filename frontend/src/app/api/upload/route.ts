import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Upload API operational" });
}

export async function POST() {
  return NextResponse.json({ message: "File upload endpoint operational" });
}
