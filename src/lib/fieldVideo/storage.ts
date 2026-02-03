import { getSupabaseServerClient, FIELD_CAPTURES_BUCKET } from "@/lib/supabase/server";

export const FIELD_CAPTURES_BUCKET_NAME = FIELD_CAPTURES_BUCKET;

/** Path format: {classId}/{captureId}-{type}.{ext} */
export function buildStoragePath(
  classId: string,
  captureId: string,
  type: "photo" | "video" | "thumb",
  ext: string
): string {
  return `${classId}/${captureId}-${type}.${ext}`;
}

export type UploadResult = {
  path: string;
  error?: string;
};

/**
 * Upload a buffer to field-captures bucket. Creates bucket if it does not exist.
 */
export async function uploadFieldCapture(
  path: string,
  body: Buffer,
  contentType: string
): Promise<UploadResult> {
  const supabase = getSupabaseServerClient();
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === FIELD_CAPTURES_BUCKET);
  if (!exists) {
    await supabase.storage.createBucket(FIELD_CAPTURES_BUCKET, {
      public: false,
      fileSizeLimit: 50 * 1024 * 1024, // 50MiB
    });
  }
  const { error } = await supabase.storage
    .from(FIELD_CAPTURES_BUCKET)
    .upload(path, body, {
      contentType,
      upsert: true,
    });
  if (error) {
    return { path, error: error.message };
  }
  return { path };
}

/** Signed URL expiry in seconds (1 hour). */
const SIGNED_URL_EXPIRY = 3600;

/**
 * Create a signed URL for viewing a stored file. Caller must verify access (teacher for class, trainee for own).
 */
export async function getSignedUrlForPath(path: string): Promise<string | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.storage
    .from(FIELD_CAPTURES_BUCKET)
    .createSignedUrl(path, SIGNED_URL_EXPIRY);
  if (error || !data?.signedUrl) {
    return null;
  }
  return data.signedUrl;
}
