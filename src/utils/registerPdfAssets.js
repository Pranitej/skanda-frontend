import pdfMake from "pdfmake/build/pdfmake";

let cached = null;

async function toBase64(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

export async function getPdfImages() {
  if (cached) return cached;

  const logo = await toBase64("/skanda-logo.png");

  cached = {
    "skanda-logo.png": logo,
  };

  return cached;
}
