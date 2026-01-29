"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import postgres from "postgres";

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),
    status: z.enum(["pending", "paid"]),
    date: z.string(),
    redirectTo: z.string(),
});

const CreateInvoice = FormSchema.omit({
    id: true,
    date: true,
});

const sql = postgres(process.env.POSTGRES_URL!, {
    ssl: process.env.POSTGRES_URL!.includes("localhost") ? false : "require",
});

export async function createInvoice(formData: FormData) {
    const { customerId, amount, status, redirectTo } = CreateInvoice.parse({
        customerId: formData.get("customerId"),
        amount: formData.get("amount"),
        status: formData.get("status"),
        redirectTo: formData.get("redirectTo"),
    });
    console.log({ customerId, amount, status, redirectTo });

    const amountInCents = amount * 100;
    const date = new Date().toISOString().split("T")[0];

    await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `;

    revalidatePath("/dashboard/invoices");
    redirect("/dashboard/invoices");
}
