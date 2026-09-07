import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string || "Untitled Path";

    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const id = Math.random().toString(36).substring(2, 10);
    const fileName = `${id}-${file.name}`;
    const fileContent = await file.text();
    
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_REPO = process.env.GITHUB_REPO; // format: "username/repo"

    // 1. Save original map file
    await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/uploads/${fileName}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `Upload ${fileName}`,
        content: Buffer.from(fileContent).toString('base64')
      })
    });

    // 2. Save JSON metadata (The "Database" row)
    const metadata = {
      id,
      title,
      type: file.name.split('.').pop(),
      createdAt: new Date().toISOString(),
      fileUrl: `https://raw.githubusercontent.com/${GITHUB_REPO}/main/uploads/${fileName}`
    };

    await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/database/${id}.json`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `Add metadata ${id}`,
        content: Buffer.from(JSON.stringify(metadata)).toString('base64')
      })
    });

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
