// Save this as: app/api/upload/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string || 'Untitled Path';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_REPO = process.env.GITHUB_REPO;

    if (!GITHUB_TOKEN || !GITHUB_REPO) {
      return NextResponse.json(
        { error: 'Missing environment variables' },
        { status: 500 }
      );
    }

    const id = Math.random().toString(36).substring(2, 10);
    const fileName = `${id}-${file.name}`;
    const fileContent = await file.text();
    const fileType = file.name.split('.').pop()?.toLowerCase() || 'json';

    // 1. Save original map file to uploads folder
    const uploadRes = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/uploads/${fileName}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `Upload ${fileName}`,
          content: Buffer.from(fileContent).toString('base64')
        })
      }
    );

    if (!uploadRes.ok) {
      throw new Error(`Failed to upload file: ${uploadRes.statusText}`);
    }

    // 2. Save JSON metadata to database folder
    const metadata = {
      id,
      title,
      type: fileType,
      createdAt: new Date().toISOString(),
      fileUrl: `https://raw.githubusercontent.com/${GITHUB_REPO}/main/uploads/${fileName}`
    };

    const metadataRes = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/database/${id}.json`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `Add metadata ${id}`,
          content: Buffer.from(JSON.stringify(metadata)).toString('base64')
        })
      }
    );

    if (!metadataRes.ok) {
      throw new Error(`Failed to save metadata: ${metadataRes.statusText}`);
    }

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error('Upload error:', err);
    return NextResponse.json(
      { error: err.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
