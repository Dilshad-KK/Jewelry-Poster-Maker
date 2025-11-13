import { NextResponse } from "next/server";
import sharp from "sharp";
import { supabaseAdmin } from "@/lib/supabase/server";
import { isAdminAuthorized } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!supabaseAdmin) {
    console.error("Supabase admin client not initialized");
    return NextResponse.json(
      { error: "Server misconfiguration: Supabase client not available" },
      { status: 500 }
    );
  }

  const form = await req.formData();
  const file = form.get("file");
  const folder = (form.get("folder") as string) || "uploads";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    // Validate source image
    const meta = await sharp(buffer).metadata();
    if (!meta.width || !meta.height) {
      throw new Error("Unsupported or unreadable image");
    }

    // Convert to PNG
    const pngBuffer = await sharp(buffer)
      .rotate()
      .png({ compressionLevel: 9, quality: 90 })
      .toBuffer();

    // Validate converted result
    const check = await sharp(pngBuffer).metadata();
    if (!check.width || !check.height) {
      throw new Error("Conversion produced invalid image");
    }

    // Unique safe path
    const stamp = Date.now();
    const safeName = (file.name || "upload").replace(/[^a-zA-Z0-9._-]/g, "_");
    const base = safeName.replace(/\.[^.]+$/, "");
    const path = `${folder}/${stamp}-${base}.png`;

    // ✅ Type assertion to satisfy TS (we already checked above)
    const sb = supabaseAdmin!;

    const { data, error } = await sb.storage
      .from("uploads")
      .upload(path, pngBuffer, {
        contentType: "image/png",
        upsert: false,
        cacheControl: "3600",
      });

    if (error) throw new Error(error.message);

    const { data: pub } = sb.storage.from("uploads").getPublicUrl(path);

    return NextResponse.json({
      publicUrl: pub?.publicUrl ?? null,
      path,
      bucket: "uploads",
    });
  } catch (err) {
    console.error("Server conversion failed:", err);
    return NextResponse.json(
      { error: "Unsupported or corrupt image" },
      { status: 400 }
    );
  }
}
