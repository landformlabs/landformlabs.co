import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    // Get the secure password from environment variable (server-side only)
    const correctPassword = process.env.LANDFORM_APP_PASSWORD;

    // Check if environment variable is configured
    if (!correctPassword) {
      return NextResponse.json(
        { success: false, error: 'Authentication not configured' },
        { status: 500 }
      );
    }

    // Validate the provided password
    const isValid = password === correctPassword;

    return NextResponse.json({
      success: isValid,
      error: isValid ? null : 'Invalid password'
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Authentication request failed' },
      { status: 500 }
    );
  }
}
