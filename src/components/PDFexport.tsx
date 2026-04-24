// PDFExport.tsx
import html2pdf from "html2pdf.js";

const PDFExport = () => {
  const handleExport = () => {
    const element = document.getElementById("pdf-content");
    if (!element) return;

    const opt = {
      margin:       0.5,
      filename:     `retinal-analysis-${Date.now()}.pdf`,
      image:        { type: "jpeg", quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: "in", format: "letter", orientation: "portrait" },
      pagebreak:    { mode: ["avoid-all", "css", "legacy"] }
    };

    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="flex justify-center mt-4">
      <button
        onClick={handleExport}
        className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition"
      >
        Download PDF
      </button>
    </div>
  );
};

export default PDFExport;
