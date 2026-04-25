import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { type, lot_id, lot_name } = await req.json();

    if (!type || !lot_id) {
      return NextResponse.json(
        { error: 'Missing required fields: type, lot_id' },
        { status: 400 }
      );
    }

    const testData = {
      lot_id,
      lot_name: lot_name || 'Test Lot',
    };

    const triggerResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/events/trigger`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          lot_id,
          data: testData,
          triggered_by: 'test',
        }),
      }
    );

    if (!triggerResponse.ok) {
      throw new Error(`Failed to trigger notification: ${triggerResponse.statusText}`);
    }

    const result = await triggerResponse.json();

    return NextResponse.json({
      success: true,
      message: `Test notification triggered: ${type}`,
      event_id: result.event_id,
    });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
