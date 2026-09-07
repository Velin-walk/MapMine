import { NextResponse } from 'next/server';

export async function GET() {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GITHUB_REPO = process.env.GITHUB_REPO;

  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/database`, {
    headers: { Authorization: `Bearer ${GITHUB_TOKEN}` },
    next: { revalidate: 60 } // Cache for 1 minute
  });

  if (!res.ok) return NextResponse.json([]);

  const files = await res.json();
  const maps = await Promise.all(files.map(async (f: any) => {
    const data = await fetch(f.download_url).then(r => r.json());
    return data;
  }));

  return NextResponse.json(maps.sort((a: any, b: any) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ));
}
