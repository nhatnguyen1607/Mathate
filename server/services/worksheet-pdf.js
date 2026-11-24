import PDFDocument from "pdfkit";
import { fileURLToPath } from "node:url";
const fontPath = fileURLToPath(
  new URL("../assets/Nunito-Medium.ttf", import.meta.url),
);
const boldFontPath = fileURLToPath(
  new URL("../assets/Nunito-ExtraBold.ttf", import.meta.url),
);
export function worksheetPDF({ classroom, activity, groups }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 45,
      bufferPages: true,
      info: {
        Title: `Phiếu luyện tập - ${classroom.name} - ${activity.topic.name}`,
        Author: "Mathate",
      },
    });
    const buffers = [];
    doc.on("data", (b) => buffers.push(b));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);
    try {
      doc
        .registerFont("Nunito", fontPath)
        .registerFont("NunitoBold", boldFontPath)
        .font("Nunito");
      groups.forEach((group, index) => {
        if (index) doc.addPage();
        const heading = (continued = false) => {
          doc
            .fillColor("#347e52")
            .fontSize(12)
            .text("MATHATE · CÙNG NHAU KHÁM PHÁ");
          doc
            .moveDown(0.35)
            .font("NunitoBold")
            .fillColor("#263c32")
            .fontSize(21)
            .text(
              `Phiếu luyện tập · Nhóm ${group.number}${continued ? " (tiếp)" : ""}`,
            );
          doc
            .moveDown(0.4)
            .font("Nunito")
            .fontSize(11)
            .text(`Lớp: ${classroom.name}  |  Chủ đề: ${activity.topic.name}`);
          doc.moveDown(0.6).fontSize(11).text("Các thành viên:");
          group.members.forEach((member, i) =>
            doc.text(`${i + 1}. ${member.fullName}`),
          );
          doc.moveDown(0.8);
          doc
            .moveTo(45, doc.y)
            .lineTo(550, doc.y)
            .strokeColor("#c8d7c3")
            .stroke();
          doc.moveDown(0.8);
        };
        heading();
        group.exercises.forEach((exercise) => {
          const height = doc
            .fontSize(12)
            .heightOfString(exercise.problem, { width: 505, lineGap: 4 });
          if (doc.y + Math.min(height, 250) + 110 > 770) {
            doc.addPage();
            heading(true);
          }
          doc
            .font("NunitoBold")
            .fontSize(14)
            .fillColor("#263c32")
            .text(`Bài ${exercise.number}`);
          doc
            .moveDown(0.35)
            .font("Nunito")
            .fontSize(12)
            .text(exercise.problem, { width: 505, lineGap: 4 });
          doc
            .moveDown(0.65)
            .fontSize(10)
            .fillColor("#53634e")
            .text("Cùng thảo luận và trình bày cách giải:");
          for (let line = 0; line < 5; line++) {
            if (doc.y + 26 > 775) {
              doc.addPage();
              heading(true);
            }
            doc.y += 22;
            doc
              .moveTo(45, doc.y)
              .lineTo(550, doc.y)
              .strokeColor("#d9dfd5")
              .lineWidth(0.5)
              .stroke();
          }
          doc.moveDown(1.1).fillColor("#263c32");
        });
      });
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        doc
          .fontSize(9)
          .fillColor("#53634e")
          .text(
            `Mathate · Mỗi cách nghĩ là một khám phá.                                  Trang ${i + 1}/${pages.count}`,
            45,
            800,
            { lineBreak: false },
          );
      }
      doc.end();
    } catch (error) {
      reject(error);
      doc.destroy();
    }
  });
}
