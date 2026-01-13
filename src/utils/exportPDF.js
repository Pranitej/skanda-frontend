import { renderToStaticMarkup } from "react-dom/server";
import api from "../api/api";

export async function exportInvoicePDF(Component, props, filename) {
  const html = renderToStaticMarkup(<Component {...props} />);

  const res = await api.post("/pdf/render", { html }, { responseType: "blob" });

  const blob = new Blob([res.data], { type: "application/pdf" });
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
