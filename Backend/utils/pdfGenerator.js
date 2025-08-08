import PDFDocument from 'pdfkit';
import fs from 'fs';

export const generateUserListPDF = (users, filePath) => {
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream(filePath));

  doc.fontSize(18).text('User List Report', { align: 'center' });
  doc.moveDown();

  users.forEach((user, index) => {
    doc.fontSize(12).text(
      `${index + 1}. ${user.firstName} ${user.lastName} | ${user.email} | ${user.role} | ${user.city}`
    );
    doc.moveDown(0.5);
  });

  doc.end();
};

export const generateUserProfilePDF = (user, filePath) => {
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream(filePath));

  doc.fontSize(18).text('User Profile Report', { align: 'center' });
  doc.moveDown();

  doc.fontSize(12).text(`Name: ${user.firstName} ${user.lastName}`);
  doc.text(`Email: ${user.email}`);
  doc.text(`Role: ${user.role}`);
  doc.text(`City: ${user.city}`);
  doc.text(`Mobile: ${user.mobile}`);
  doc.text(`VU ID: ${user.vuId}`);
  doc.text(`Verified: ${user.isVerified ? 'Yes' : 'No'}`);

  doc.end();
};