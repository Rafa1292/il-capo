import { redirect } from "next/navigation";

// La carta pasó a ser la portada. Se mantiene /menu porque hay enlaces sueltos
// (QR impresos, mensajes de WhatsApp, marcadores) que apuntan acá.
// Redirect temporal a propósito: un 308 lo cachea el navegador para siempre y
// dejaría la ruta inutilizable si algún día volvemos a usarla.
export default function MenuRedirect() {
  redirect("/");
}
