
import { withSupabase } from "npm:@supabase/server@1";

type Payload = Record<string, any>;

const BUCKET = "nexus-private-documents";
const MAX_FILE_SIZE = 25 * 1024 * 1024;
const SIGNED_URL_SECONDS = 60;

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const isUuid = (v: unknown): v is string =>
  typeof v === "string" && UUID.test(v);

const clean = (v: unknown, max = 500): string =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

const safeFileName = (value: unknown): string => {
  const raw = clean(value, 255);

  return raw
    .replace(/[\\/]/g, "_")
    .replace(/[^A-Za-z0-9._ -]/g, "_")
    .replace(/\.\.+/g, ".")
    .replace(/\s+/g, "_")
    .replace(/^[. ]+|[. ]+$/g, "")
    .slice(0, 180);
};

const reply = (status: number, body: Payload) =>
  Response.json(body, { status });

const ok = (data: unknown) =>
  reply(200, { success: true, data });

const fail = (status: number, code: string, message: string) =>
  reply(status, { success: false, code, message });

export default {
  fetch: withSupabase(
    { auth: ["user", "publishable"] },
    async (req, ctx) => {
      if (req.method !== "POST") {
        return fail(405, "METHOD_NOT_ALLOWED", "Use POST.");
      }

      if (ctx.authMode !== "user" || !ctx.userClaims?.id) {
        return fail(
          401,
          "USER_SESSION_REQUIRED",
          "Sign in to access Davonium Nexus private documents.",
        );
      }

      let body: Payload;

      try {
        body = await req.json();
      } catch {
        return fail(400, "INVALID_JSON", "The request body must be valid JSON.");
      }

      const action = clean(body.action, 80);

      if (!action) {
        return fail(400, "ACTION_REQUIRED", "A document action is required.");
      }

      const supabase = ctx.supabase;
      const actorId = ctx.userClaims.id;

      const workspace =
        clean(body.organization_id, 100) || "davonium-technologies";

      const { data: organization, error: orgError } = await supabase
        .from("organizations")
        .select("id,name,slug")
        .eq(
          isUuid(workspace) ? "id" : "slug",
          workspace,
        )
        .maybeSingle();

      if (orgError) {
        return fail(400, "WORKSPACE_LOOKUP_FAILED", "Could not resolve the workspace.");
      }

      if (!organization) {
        return fail(404, "WORKSPACE_NOT_FOUND", "Workspace not found.");
      }

      const { data: membership, error: memberError } = await supabase
        .from("organization_memberships")
        .select("role,status")
        .eq("organization_id", organization.id)
        .eq("user_id", actorId)
        .maybeSingle();

      if (memberError) {
        return fail(400, "MEMBERSHIP_LOOKUP_FAILED", "Could not verify workspace membership.");
      }

      if (!membership || membership.status !== "active") {
        return fail(403, "ACTIVE_MEMBERSHIP_REQUIRED", "An active workspace membership is required.");
      }

      // ------------------------------------------------------
      // LIST PROJECT DOCUMENTS
      // ------------------------------------------------------
      if (action === "documents.list") {
        let query: any = supabase
          .from("project_documents")
          .select(
            "id,project_id,file_name,content_type,file_size_bytes,checksum_sha256,client_visible,document_status,uploaded_by,created_at",
          )
          .eq("organization_id", organization.id)
          .eq("document_status", "active")
          .order("created_at", { ascending: false })
          .limit(100);

        if (body.project_id !== undefined) {
          if (!isUuid(body.project_id)) {
            return fail(400, "INVALID_PROJECT_ID", "A valid project_id is required.");
          }

          query = query.eq("project_id", body.project_id);
        }

        const { data, error } = await query;

        if (error) {
          return fail(403, "DOCUMENT_LIST_DENIED", "You cannot view these project documents.");
        }

        return ok(data ?? []);
      }

      // ------------------------------------------------------
      // PREPARE A TIME-LIMITED UPLOAD
      // ------------------------------------------------------
      if (action === "upload.prepare") {
        const projectId = body.project_id;
        const fileName = safeFileName(body.file_name);
        const contentType = clean(body.content_type, 150).toLowerCase();
        const fileSize = Number(body.file_size_bytes);

        if (!isUuid(projectId)) {
          return fail(400, "INVALID_PROJECT_ID", "A valid project_id is required.");
        }

        if (!fileName) {
          return fail(400, "INVALID_FILE_NAME", "Provide a valid file name.");
        }

        if (!MIME_TYPES.has(contentType)) {
          return fail(415, "FILE_TYPE_NOT_ALLOWED", "This file type is not allowed.");
        }

        if (
          !Number.isSafeInteger(fileSize) ||
          fileSize < 1 ||
          fileSize > MAX_FILE_SIZE
        ) {
          return fail(413, "FILE_SIZE_NOT_ALLOWED", "Files must be between 1 byte and 25 MB.");
        }

        // The user-scoped query verifies that this project is visible.
        const { data: project, error: projectError } = await supabase
          .from("projects")
          .select("id,organization_id")
          .eq("id", projectId)
          .eq("organization_id", organization.id)
          .maybeSingle();

        if (projectError) {
          return fail(403, "PROJECT_ACCESS_DENIED", "You cannot access this project.");
        }

        if (!project) {
          return fail(404, "PROJECT_NOT_FOUND", "Project not found or not accessible.");
        }

        const documentId = crypto.randomUUID();

        // Path layout:
        // organization / project / uploader / document / filename
        // The Storage INSERT policy checks all three access boundaries.
        const storageKey = [
          organization.id,
          project.id,
          actorId,
          documentId,
          fileName,
        ].join("/");

        const { data: upload, error: uploadError } = await supabase
          .storage
          .from(BUCKET)
          .createSignedUploadUrl(storageKey, { upsert: false });

        if (uploadError || !upload) {
          return fail(
            403,
            "UPLOAD_NOT_AUTHORIZED",
            "Storage rejected this upload request. Check project document permissions and the private bucket policies.",
          );
        }

        return ok({
          document_id: documentId,
          project_id: project.id,
          bucket: BUCKET,
          path: upload.path,
          token: upload.token,
          signed_url: upload.signedUrl,
          content_type: contentType,
          file_size_limit_bytes: MAX_FILE_SIZE,
          upload_token_validity: "2 hours",
          note: "Treat this signed upload token as a temporary secret. Complete the upload before its token expires.",
        });
      }

      // ------------------------------------------------------
      // COMPLETE UPLOAD AND REGISTER DOCUMENT METADATA
      // ------------------------------------------------------
      if (action === "upload.complete") {
        const projectId = body.project_id;
        const documentId = body.document_id;
        const fileName = safeFileName(body.file_name);
        const contentType = clean(body.content_type, 150).toLowerCase();
        const reportedSize = Number(body.file_size_bytes);
        const checksum = body.checksum_sha256 ?? null;
        const clientVisible = body.client_visible ?? false;

        if (!isUuid(projectId) || !isUuid(documentId)) {
          return fail(400, "INVALID_DOCUMENT_REFERENCE", "Valid project_id and document_id are required.");
        }

        if (!fileName || !MIME_TYPES.has(contentType)) {
          return fail(415, "INVALID_DOCUMENT_METADATA", "Provide an allowed file name and content type.");
        }

        if (
          !Number.isSafeInteger(reportedSize) ||
          reportedSize < 1 ||
          reportedSize > MAX_FILE_SIZE
        ) {
          return fail(413, "FILE_SIZE_NOT_ALLOWED", "The reported file size is invalid or exceeds 25 MB.");
        }

        if (
          checksum !== null &&
          (typeof checksum !== "string" || !/^[a-fA-F0-9]{64}$/.test(checksum))
        ) {
          return fail(400, "INVALID_CHECKSUM", "checksum_sha256 must contain 64 hexadecimal characters.");
        }

        if (typeof clientVisible !== "boolean") {
          return fail(400, "INVALID_VISIBILITY", "client_visible must be true or false.");
        }

        const { data: project, error: projectError } = await supabase
          .from("projects")
          .select("id,organization_id")
          .eq("id", projectId)
          .eq("organization_id", organization.id)
          .maybeSingle();

        if (projectError || !project) {
          return fail(404, "PROJECT_NOT_FOUND", "Project not found or not accessible.");
        }

        const storageKey = [
          organization.id,
          project.id,
          actorId,
          documentId,
          fileName,
        ].join("/");

        // Use the server-only client only to verify that the exact
        // object uploaded to this user's project folder exists.
        // Document metadata is still inserted through the RLS client.
        const admin = ctx.supabaseAdmin;

        if (!admin) {
          return fail(500, "STORAGE_VERIFICATION_UNAVAILABLE", "Storage verification is unavailable.");
        }

        const folder = [
          organization.id,
          project.id,
          actorId,
          documentId,
        ].join("/");

        const { data: objects, error: listError } = await admin
          .storage
          .from(BUCKET)
          .list(folder, { limit: 20, search: fileName });

        if (listError) {
          return fail(502, "UPLOAD_VERIFICATION_FAILED", "Could not verify the uploaded file.");
        }

        const uploadedObject = (objects ?? []).find(
          (item: any) => item.name === fileName,
        );

        if (!uploadedObject) {
          return fail(409, "FILE_NOT_UPLOADED", "Upload the file using the signed URL before completing registration.");
        }

        const actualSize = Number(uploadedObject.metadata?.size ?? reportedSize);

        if (
          !Number.isSafeInteger(actualSize) ||
          actualSize < 1 ||
          actualSize > MAX_FILE_SIZE
        ) {
          return fail(413, "STORED_FILE_SIZE_INVALID", "The stored file size is invalid or exceeds 25 MB.");
        }

        const { data: document, error: insertError } = await supabase
          .from("project_documents")
          .insert({
            organization_id: organization.id,
            project_id: project.id,
            storage_provider: "supabase_storage",
            storage_bucket: BUCKET,
            storage_key: storageKey,
            file_name: fileName,
            content_type: contentType,
            file_size_bytes: actualSize,
            checksum_sha256: checksum,
            client_visible: clientVisible,
            document_status: "active",
            uploaded_by: actorId,
          })
          .select(
            "id,project_id,file_name,content_type,file_size_bytes,checksum_sha256,client_visible,document_status,created_at",
          )
          .single();

        if (insertError) {
          return fail(
            insertError.code === "42501" ? 403 : 400,
            "DOCUMENT_REGISTRATION_FAILED",
            "The file exists, but your account could not register its document metadata.",
          );
        }

        return ok({
          document,
          note: "The private file is registered. Download access is controlled by project document RLS.",
        });
      }

      // ------------------------------------------------------
      // ISSUE A SHORT-LIVED DOWNLOAD LINK
      // ------------------------------------------------------
      if (action === "documents.download") {
        if (!isUuid(body.document_id)) {
          return fail(400, "INVALID_DOCUMENT_ID", "A valid document_id is required.");
        }

        const { data: document, error } = await supabase
          .from("project_documents")
          .select("id,storage_bucket,storage_key,file_name,document_status")
          .eq("organization_id", organization.id)
          .eq("id", body.document_id)
          .eq("document_status", "active")
          .maybeSingle();

        if (error) {
          return fail(403, "DOCUMENT_ACCESS_DENIED", "You cannot access this document.");
        }

        if (!document || document.storage_bucket !== BUCKET) {
          return fail(404, "DOCUMENT_NOT_FOUND", "Document not found or not accessible.");
        }

        const { data: signed, error: signError } = await supabase
          .storage
          .from(BUCKET)
          .createSignedUrl(
            document.storage_key,
            SIGNED_URL_SECONDS,
            { download: document.file_name },
          );

        if (signError || !signed) {
          return fail(403, "DOWNLOAD_NOT_AUTHORIZED", "Storage did not authorise this download.");
        }

        return ok({
          document_id: document.id,
          signed_url: signed.signedUrl,
          expires_in_seconds: SIGNED_URL_SECONDS,
          note: "This link expires after 60 seconds. Request another link when needed.",
        });
      }

      // ------------------------------------------------------
      // CONTROL CLIENT VISIBILITY
      // ------------------------------------------------------
      if (action === "documents.visibility.update") {
        if (!isUuid(body.document_id) || typeof body.client_visible !== "boolean") {
          return fail(400, "INVALID_VISIBILITY_UPDATE", "Provide a valid document_id and client_visible boolean.");
        }

        const { data, error } = await supabase
          .from("project_documents")
          .update({ client_visible: body.client_visible })
          .eq("organization_id", organization.id)
          .eq("id", body.document_id)
          .select("id,project_id,client_visible,document_status")
          .maybeSingle();

        if (error) {
          return fail(403, "VISIBILITY_UPDATE_DENIED", "You cannot change this document's client visibility.");
        }

        if (!data) {
          return fail(404, "DOCUMENT_NOT_FOUND", "Document not found or not accessible.");
        }

        return ok(data);
      }

      // ------------------------------------------------------
      // ARCHIVE — metadata remains for audit history
      // ------------------------------------------------------
      if (action === "documents.archive") {
        if (!isUuid(body.document_id)) {
          return fail(400, "INVALID_DOCUMENT_ID", "A valid document_id is required.");
        }

        const { data, error } = await supabase
          .from("project_documents")
          .update({ document_status: "archived", client_visible: false })
          .eq("organization_id", organization.id)
          .eq("id", body.document_id)
          .select("id,project_id,document_status,client_visible")
          .maybeSingle();

        if (error) {
          return fail(403, "DOCUMENT_ARCHIVE_DENIED", "You cannot archive this document.");
        }

        if (!data) {
          return fail(404, "DOCUMENT_NOT_FOUND", "Document not found or not accessible.");
        }

        return ok(data);
      }

      return fail(
        400,
        "UNKNOWN_ACTION",
        "Supported actions: documents.list, upload.prepare, upload.complete, documents.download, documents.visibility.update, documents.archive.",
      );
    },
  ),
};
