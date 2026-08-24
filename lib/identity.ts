import { cookies } from "next/headers";
export const identityCookie = "open_radio_identity";
export async function viewerId() { return (await cookies()).get(identityCookie)?.value; }
