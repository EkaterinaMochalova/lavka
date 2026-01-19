import { NextResponse } from 'next/server';

const GLB_URL = 'https://xtkg2ucurafhokax.public.blob.vercel-storage.com/armoury.glb';

export async function GET() {
  const res = await fetch(GLB_URL);
  if (!res.ok) {
    return new NextResponse(`Failed to fetch GLB: ${res.status}`, { status: 500 });
  }

  const arrayBuffer = await res.arrayBuffer();

  return new NextResponse(arrayBuffer, {
    headers: {
      'Content-Type': 'model/gltf-binary',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}