// Save this as: app/api/maps/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_REPO = process.env.GITHUB_REPO;

    if (!GITHUB_TOKEN || !GITHUB_REPO) {
      return NextResponse.json(
        { error: 'Missing environment variables' },
        { status: 500 }
      );
    }

    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/database`,
      {
        headers: { Authorization: `Bearer ${GITHUB_TOKEN}` },
        next: { revalidate: 60 } // Cache for 1 minute
      }
    );

    if (!res.ok) {
      console.error('GitHub API error:', res.status);
      return NextResponse.json([]);
    }

    const files = await res.json();
    
    if (!Array.isArray(files)) {
      return NextResponse.json([]);
    }

    const maps = await Promise.all(
      files
        .filter((f: any) => f.name.endsWith('.json'))
        .map(async (f: any) => {
          try {
            const data = await fetch(f.download_url).then(r => r.json());
            return data;
          } catch (err) {
            console.error(`Failed to fetch ${f.name}:`, err);
            return null;
          }
        })
    );

    return NextResponse.json(
      maps.filter(Boolean).sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    );
  } catch (err: any) {
    console.error('Error fetching maps:', err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
