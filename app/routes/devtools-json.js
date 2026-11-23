// Chrome DevTools meminta /.well-known/appspecific/com.chrome.devtools.json saat DevTools dibuka.
// Tanpa route ini React Router mencatat error "No route matches URL" di terminal (tidak berbahaya).
export function loader() {
  return new Response(null, { status: 204 });
}
