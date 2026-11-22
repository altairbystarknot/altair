import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/staff";
import { readCatalogAsDraft } from "@/lib/catalog/admin";
import { catalogWorkbook } from "@/lib/catalog/spreadsheet";
import { createServerSupabase } from "@/lib/supabase/server";

// GET /api/panel/catalog-xlsx — the business's current catalog as the Excel template (owner/admin).
export async function GET() {
  const sb = await createServerSupabase();
  const staff = await requireStaff(sb, ["owner", "admin"]);
  if (!staff) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const buf = await catalogWorkbook(await readCatalogAsDraft(sb));
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="catalogo-altair.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
