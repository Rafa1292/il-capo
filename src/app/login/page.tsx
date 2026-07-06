import { redirect } from "next/navigation";

// La cuenta vive en /cuenta; esta ruta existe solo por compatibilidad de links viejos.
export default function LoginRedirect() {
  redirect("/cuenta");
}
