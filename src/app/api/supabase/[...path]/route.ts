import { NextResponse } from 'next/server';

/**
 * @fileOverview Redundant Proxy Handler.
 * This route has been disabled in favor of a direct client connection 
 * using NEXT_PUBLIC variables as requested.
 */

export async function GET() { return new NextResponse(null, { status: 404 }); }
export async function POST() { return new NextResponse(null, { status: 404 }); }
export async function PUT() { return new NextResponse(null, { status: 404 }); }
export async function PATCH() { return new NextResponse(null, { status: 404 }); }
export async function DELETE() { return new NextResponse(null, { status: 404 }); }
