import { createClient } from "@supabase/supabase-js";

function getSupabaseAdminClient(): { client: any; error?: { status: number; code: string; message: string } } {
  const rawUrl = (
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    ""
  ).trim();
  const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

  if (!supabaseUrl || supabaseUrl.includes("placeholder")) {
    return {
      client: null,
      error: {
        status: 500,
        code: "MISSING_SUPABASE_URL",
        message: "Server configuration error: SUPABASE_URL environment variable is missing on Netlify.",
      },
    };
  }

  if (!serviceRoleKey) {
    return {
      client: null,
      error: {
        status: 500,
        code: "MISSING_SERVICE_ROLE_KEY",
        message: "Server configuration error: SUPABASE_SERVICE_ROLE_KEY is required for storage uploads on Netlify.",
      },
    };
  }

  return { client: createClient(supabaseUrl, serviceRoleKey) };
}

export const handler = async (event: any) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        success: false,
        operation: "image_upload",
        status: 405,
        code: "METHOD_NOT_ALLOWED",
        message: "Method Not Allowed",
      }),
    };
  }

  try {
    const { image, name } = JSON.parse(event.body || "{}");
    if (!image) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          operation: "image_upload",
          status: 400,
          code: "MISSING_IMAGE_PAYLOAD",
          message: "No image data was provided in upload request.",
        }),
      };
    }

    const { client: supabase, error: adminErr } = getSupabaseAdminClient();
    if (adminErr || !supabase) {
      return {
        statusCode: adminErr?.status || 500,
        headers,
        body: JSON.stringify({
          success: false,
          operation: "server_configuration",
          status: adminErr?.status || 500,
          code: adminErr?.code || "MISSING_SERVICE_ROLE_KEY",
          message: adminErr?.message || "Server configuration error: SUPABASE_SERVICE_ROLE_KEY is missing on Netlify.",
        }),
      };
    }

    let buffer: Buffer;
    let ext = "jpg";
    let mimeType = "image/jpeg";

    if (image.startsWith("data:")) {
      const matches = image.match(/^data:(image\/[a-zA-Z0-9.\-_+]+);base64,(.+)$/);
      if (matches) {
        mimeType = matches[1];
        ext = matches[1].split("/")[1] || "jpg";
        buffer = Buffer.from(matches[2], "base64");
      } else {
        const parts = image.split(",");
        buffer = Buffer.from(parts[1] || parts[0], "base64");
      }
    } else {
      buffer = Buffer.from(image, "base64");
    }

    if (name && name.includes(".")) {
      const parsedExt = name.split(".").pop()?.toLowerCase();
      if (parsedExt) ext = parsedExt;
    }

    const fileName = `property-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const filePath = `listings/${fileName}`;

    // Upload to Supabase Storage bucket 'property-images' using Service Role Client
    const { error: uploadErr } = await supabase.storage
      .from("property-images")
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadErr) {
      console.warn("Supabase Storage upload warning:", uploadErr.message);
      // Attempt bucket creation if missing
      if (uploadErr.message?.includes("not found") || uploadErr.message?.includes("Bucket")) {
        try {
          await supabase.storage.createBucket("property-images", { public: true });
          const { error: retryErr } = await supabase.storage
            .from("property-images")
            .upload(filePath, buffer, { contentType: mimeType, upsert: true });
          if (retryErr) {
            return {
              statusCode: 500,
              headers,
              body: JSON.stringify({
                success: false,
                operation: "image_upload",
                status: 500,
                code: retryErr.code || "STORAGE_RETRY_ERROR",
                message: `Failed to upload image to Supabase Storage: ${retryErr.message}`,
              }),
            };
          }
        } catch (bErr: any) {
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
              success: false,
              operation: "image_upload",
              status: 500,
              code: "BUCKET_CREATION_FAILED",
              message: `Storage bucket error: ${bErr?.message || uploadErr.message}`,
            }),
          };
        }
      } else {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            success: false,
            operation: "image_upload",
            status: 500,
            code: uploadErr.code || "STORAGE_UPLOAD_ERROR",
            message: `Failed to upload image to Supabase Storage: ${uploadErr.message}`,
          }),
        };
      }
    }

    const { data } = supabase.storage.from("property-images").getPublicUrl(filePath);

    if (data?.publicUrl) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          operation: "image_upload",
          url: data.publicUrl,
          filePath,
          bucket: "property-images",
        }),
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        operation: "image_upload",
        status: 500,
        code: "URL_GENERATION_FAILED",
        message: "Failed to generate public URL for uploaded image.",
      }),
    };
  } catch (err: any) {
    console.error("Error in Netlify upload-image function:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        operation: "image_upload",
        status: 500,
        code: "INTERNAL_ERROR",
        message: err?.message || "Failed to process and upload image.",
      }),
    };
  }
};

