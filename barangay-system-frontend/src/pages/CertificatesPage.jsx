// src/pages/CertificatesPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Button,
  Divider,
} from '@mui/material';
import api from '../api';
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  Header,
  Footer,
  ImageRun,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType
} from 'docx';
import logo from '../assets/logo.png';

const CERTIFICATE_TYPES = [
  { value: 'residency', label: 'Certificate of Residency' },
  { value: 'indigency', label: 'Certificate of Indigency' },
  { value: 'clearance', label: 'Barangay Clearance' },
  { value: 'general', label: 'General Certificate' },
  { value: 'jobseeker', label: 'First Time Job Seeker (RA 11261)' },
  { value: 'oath', label: 'Oath of Undertaking' },
  { value: 'good_moral', label: 'Certificate of Good Moral' },
];

const CertificatesPage = () => {
  const [residents, setResidents] = useState([]);
  const [selectedResidentId, setSelectedResidentId] = useState('');
  const [certType, setCertType] = useState('residency');
  const [purpose, setPurpose] = useState('');
  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [barangayName, setBarangayName] = useState('635');
  const [municipality, setMunicipality] = useState('City of Manila');
  const [province, setProvince] = useState('Metro Manila');
  const [captainName, setCaptainName] = useState('Danilo A. San Bueno');
  const [secretaryName, setSecretaryName] = useState('PAULA MARIE D. BAILON');
  const [placeIssued, setPlaceIssued] = useState('Barangay Hall');
  const [serialNumber, setSerialNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // ---- NEW: officials state comes BEFORE effects that use it
  const [officials, setOfficials] = useState([]);

  // Load residents
  useEffect(() => {
    const loadResidents = async () => {
      try {
        const res = await api.get('/residents');
        setResidents(res.data || []);
      } catch (err) {
        console.error('Error loading residents', err);
        setError('Failed to load residents.');
      }
    };
    loadResidents();
  }, []);
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setProfileLoading(true);
        const res = await api.get('/barangay-profile');
        if (res.data) {
          setBarangayName(res.data.barangay_name);
          setMunicipality(res.data.municipality);
          setProvince(res.data.province);
          setPlaceIssued(res.data.place_issued || 'Barangay Hall');
        }
      } catch (err) {
        console.error('Error loading barangay profile', err);
        // optional: setError('Failed to load barangay profile.');
      } finally {
        setProfileLoading(false);
      }
    };
    loadProfile();
  }, []);

  // Load officials
  useEffect(() => {
    const loadOfficials = async () => {
      try {
        const res = await api.get('/officials');
        setOfficials(res.data || []);
      } catch (err) {
        console.error('Error loading officials for certificates', err);
      }
    };
    loadOfficials();
  }, []);

  // When officials change, auto-set captain & secretary names
  useEffect(() => {
    if (!officials.length) return;

    const captain =
      officials.find(
        (o) => o.is_captain || o.position === 'Punong Barangay'
      ) || null;
    const secretary =
      officials.find(
        (o) => o.is_secretary || o.position === 'Barangay Secretary'
      ) || null;

    if (captain) setCaptainName(captain.full_name);
    if (secretary) setSecretaryName(secretary.full_name);
  }, [officials]);

  const getSerialPrefix = (type) => {
    switch (type) {
      case 'residency': return 'RES';
      case 'indigency': return 'IND';
      case 'clearance': return 'BC';
      case 'general': return 'GEN';
      case 'jobseeker': return 'FJS';
      case 'oath': return 'OOU';
      case 'good_moral': return 'GMC';
      default: return 'CERT';
    }
  };

  const selectedResident = useMemo(
    () => residents.find((r) => String(r.id) === String(selectedResidentId)),
    [residents, selectedResidentId]
  );

  const buildFullName = (r) => {
    if (!r) return '';
    const parts = [
      r.first_name,
      r.middle_name ? `${r.middle_name.charAt(0)}.` : '',
      r.last_name,
      r.suffix || '',
    ].filter(Boolean);
    return parts.join(' ');
  };

  const calculateAge = (birthdate) => {
    if (!birthdate) return '[Age]';
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const buildCertificateBody = () => {
    if (!selectedResident) return '';

    const fullName = buildFullName(selectedResident);
    const address = selectedResident.address || `${barangayName}, ${municipality}, ${province}`;
    const age = calculateAge(selectedResident.birthdate);

    switch (certType) {
      case 'residency':
        return `This is to certify that ${fullName.toUpperCase()}, of legal age, Filipino, is a bona fide resident of this Barangay with postal address at ${address}.

This certification is being issued upon the request of the above-named person for ${purpose || 'whatever legal purpose it may serve'
          }.`;
      case 'indigency':
        return `This is to certify that the below indicated person is a bona fide resident of this barangay:

Requestor: ${fullName.toUpperCase()}
Postal Address: ${address}

I also certify that the above named person is known for his/her good character and without any derogatory record in this barangay.

Further, this certifies that the above-mentioned person is also one of the INDIGENTS of the barangay.

This certification is being issued upon the request of the aforementioned individual for the purpose below:

Purpose: ${purpose || 'Personal Use'}`;
      case 'clearance':
        return `This is to certify that ${fullName.toUpperCase()}, of legal age, Filipino, is a bona fide resident of this Barangay with postal address at ${address}.

Further, I certify that he/she is found to have NO DEROGATORY RECORD in our Barangay.

This certification is being issued upon the request of the above-named person for ${purpose || 'whatever legal purpose it may serve'
          }.`;
      case 'general':
        return `This is to certify that ${fullName.toUpperCase()}, of legal age and with residence address at ${address}, is a bona fide resident of Barangay 635, Zone 64, District VI of the City of Manila.

I further certify that their address at ${address} is not being rented nor being used for business purposes.

This certification is issued for ${purpose || 'BIR Requirement'}.`;
      case 'jobseeker':
        return `This is to certify that ${fullName.toUpperCase()}, of legal age, Filipino, is a bona fide resident of this Barangay with postal address at ${address}.

Further, I certify that he/she is qualified to avail of RA 11261 or the First-Time Jobseekers Act of 2019.

I further certify that the holder was informed of his/her rights including the duties and responsibilities accorded by RA 11261 through the Oath of Undertaking he/she has signed and executed in the presence of the Punong Barangay.`;
      case 'oath':
        return `I, ${fullName.toUpperCase()}, ${age} years of age, resident of ${address}, Barangay 635, Zone 64, District VI, City of Manila for [Years] years, availing the benefits of Republic Act 11261, otherwise known as the First Time Jobseekers Act 2019, do hereby declare, agree and undertake to abide and be bound by the following:

1. That this is the first time that I will actively look for a job, and therefore requesting that a Barangay Certification be issued in my favor to avail the benefits of the law... (see PDF for full text)`;
      case 'good_moral':
        return `This is to certify that ${fullName.toUpperCase()}, of legal age, Filipino, is a bona fide resident of this Barangay with postal address at ${address}.

He/She is known to me to be a person of good moral character and has never been involved in any trouble nor has any derogatory record in this Barangay.

This certification is being issued upon the request of the above-named person for ${purpose || 'whatever legal purpose it may serve'
          }.`;
      default:
        return '';
    }
  };

  const certificateBody = useMemo(buildCertificateBody, [
    selectedResident,
    certType,
    purpose,
    barangayName,
    municipality,
    province,
  ]);

  const handleGeneratePdf = async () => {
    setError('');

    if (!selectedResident) {
      setError('Please select a resident.');
      return;
    }

    if (!serialNumber || serialNumber.trim() === '') {
      setError('Serial Number is required.');
      return;
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'A4',
    });

    const fullName = buildFullName(selectedResident);
    const address = selectedResident.address || `${barangayName}, ${municipality}, ${province}`;
    const maritalStatus = selectedResident.civil_status || 'N/A';
    const citizenship = selectedResident.citizenship || 'Filipino';
    const currentYear = new Date(issueDate).getFullYear();
    const serialNo = serialNumber.trim();

    const certTitleObj = CERTIFICATE_TYPES.find((c) => c.value === certType);
    const certTitle = certTitleObj ? certTitleObj.label.toUpperCase() : 'CERTIFICATE';

    // Helper for lines
    const drawLine = (y, width = 0.5) => {
      doc.setLineWidth(width);
      doc.line(20, y, 190, y);
    };

    // Header
    // Left Logo
    doc.addImage(logo, 'PNG', 25, 15, 25, 25);

    // Center Text
    doc.setFont('Helvetica', 'Bold');
    doc.setFontSize(28);
    doc.text(`BARANGAY ${barangayName}`, 105, 28, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('Helvetica', 'Normal');
    doc.text('ZONE 64, DISTRICT VI, MANILA', 105, 34, { align: 'center' });

    // Right Text (Year)
    doc.setFont('Helvetica', 'Bold');
    doc.setFontSize(40);
    doc.text(`${currentYear}`, 180, 30, { align: 'right' });
    doc.setFontSize(8);
    doc.text('Permits and Clearances', 180, 34, { align: 'right' });

    drawLine(40, 0.2);

    // Serial No
    doc.setFont('Helvetica', 'Normal');
    doc.setFontSize(9);
    doc.text('Serial No. ', 140, 50);
    doc.setFont('Helvetica', 'Bold');
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(245, 245, 245);
    doc.rect(158, 45, 32, 7, 'F');
    doc.text(serialNo, 174, 50, { align: 'center' });
    doc.line(158, 52, 190, 52);

    // Title
    doc.setFontSize(22);
    if (certType === 'oath') {
      doc.setFontSize(28);
      doc.text('OATH OF UNDERTAKING', 105, 75, { align: 'center' });
    } else if (certType === 'general') {
      doc.text('CERTIFICATION', 105, 65, { align: 'center' });
    } else {
      doc.text(certTitle, 105, 65, { align: 'center' });
    }

    let fieldsY = certType === 'oath' ? 95 : 80;

    const drawField = (label, value) => {
      doc.setFont('Helvetica', 'Normal');
      doc.text(label, 35, fieldsY);
      doc.line(65, fieldsY + 1, 180, fieldsY + 1);
      doc.setFont('Helvetica', 'Bold');
      doc.text(String(value), 65, fieldsY);
      fieldsY += 10;
    };

    if (certType === 'oath') {
      doc.setFontSize(11);
      doc.setFont('Helvetica', 'Normal');
      const ageNum = calculateAge(selectedResident.birthdate);
      const introText = `I, ${fullName.toUpperCase()}, ${ageNum} years of age, resident of ${address}, Barangay 635, Zone 64, District VI, City of Manila for [Years] years, availing the benefits of Republic Act 11261, otherwise known as the First Time Jobseekers Act 2019, do hereby declare, agree and undertake to abide and be bound by the following:`;
      const introLines = doc.splitTextToSize(introText, 160);
      doc.text(introLines, 25, fieldsY);
      fieldsY += 20;

      const items = [
        "That this is the first time that I will actively look for a job, and therefore requesting that a Barangay Certification be issued in my favor to avail the benefits of the law;",
        "That I am aware that the benefit and privilege/s under the said law shall be valid only for one (1) year from the date that the Barangay Certification is issued;",
        "That I can avail the benefits of the law only once;",
        "That I understand that my personal information shall be included in the Roster/List of the First Time Jobseekers and will not be used for any unlawful purpose;",
        "That I will inform and/or report to the Barangay personally, through text or other means, or through my family/relatives once I get employed; and",
        "That I am not a beneficiary of the Job Start Program under R.A. No. 10869 and other laws that give similar exemptions for the documents or transactions exempted under R.A. No. 11261;",
        "That if issued the requested Certification, I will not use the same in any fraud, and neither falsifies nor helps and/or assists in the fabrication of the said certification.",
        "That this undertaking is made solely for the purpose of obtaining a Barangay Certification consistent with the objective of R.A. No. 11261 and not for any other purpose.",
        "That I consent to the use of my personal information pursuant to the Data Privacy Act and other applicable laws, rules, and regulations."
      ];

      items.forEach((item, index) => {
        const itemText = `${index + 1}. ${item}`;
        const itemLines = doc.splitTextToSize(itemText, 155);
        doc.text(itemLines, 25, fieldsY);
        fieldsY += itemLines.length * 5 + 2;
      });

      fieldsY += 5;
      doc.text(`Signed this ${new Date(issueDate).toLocaleDateString('en-PH', { day: 'numeric' })}th Day of ${new Date(issueDate).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })}, at Barangay 635, Zone 64, District VI, City of Manila.`, 25, fieldsY);

      fieldsY += 20;
      doc.setFont('Helvetica', 'Bold');
      doc.text(fullName.toUpperCase(), 25, fieldsY);
      doc.setFont('Helvetica', 'Normal');
      doc.text('First Time Jobseeker', 25, fieldsY + 5);

      fieldsY += 15;
      doc.text('Witnessed by:', 25, fieldsY);

      fieldsY += 15;
      doc.setFont('Helvetica', 'Bold');
      doc.text(captainName.toUpperCase(), 25, fieldsY);
      doc.setFont('Helvetica', 'Normal');
      doc.text('Punong Barangay', 25, fieldsY + 5);

      doc.setFont('Helvetica', 'Bold');
      doc.text('CELESTE A. SAN BUENO', 130, fieldsY);
      doc.setFont('Helvetica', 'Normal');
      doc.text('Barangay Kagawad', 130, fieldsY + 5);

    } else if (certType === 'clearance' || certType === 'indigency' || certType === 'residency' || certType === 'jobseeker') {
      doc.setFontSize(11);
      doc.setFont('Helvetica', 'Normal');
      let introLines = [];

      if (certType === 'clearance') {
        let introText = `This is to certify that the person (the requestor), whose information is indicated below, is known to me as a bona fide resident of this barangay. Further, I certify that he/she is found to have NO DEROGATORY RECORD in our Barangay.`;
        introLines = doc.splitTextToSize(introText, 160);
        doc.text(introLines, 25, fieldsY);
        fieldsY += 15;
        drawField("Requestor's Name", fullName.toUpperCase());
        drawField("Postal Address", address);
        fieldsY += 5;
        doc.setFont('Helvetica', 'Normal');
        doc.text("Marital Status", 35, fieldsY);
        doc.line(65, fieldsY + 1, 110, fieldsY + 1);
        doc.setFont('Helvetica', 'Bold');
        doc.text(maritalStatus, 65, fieldsY);
        doc.setFont('Helvetica', 'Normal');
        doc.text("Citizenship", 35, fieldsY + 10);
        doc.line(65, fieldsY + 11, 110, fieldsY + 11);
        doc.setFont('Helvetica', 'Bold');
        doc.text(citizenship, 65, fieldsY + 10);
        fieldsY += 25;
        doc.setFont('Helvetica', 'Normal');
        doc.text('This certification is being issued upon the request of the aforementioned individual for the purpose below:', 25, fieldsY);
        fieldsY += 15;
        drawField("Purpose", purpose || 'Personal Use');
      } else if (certType === 'indigency') {
        doc.text("This is to certify that the below indicated person is a bona fide resident of this barangay:", 25, fieldsY);
        fieldsY += 12;
        drawField("Requestor", fullName.toUpperCase());
        drawField("Postal Address", address);
        fieldsY += 10;
        let midText = "I also certify that the above named person is known for his/her good character and without any derogatory record in this barangay. \n\nFurther, this certifies that the above-mentioned person is also one of the INDIGENTS of the barangay.\n\nThis certification is being issued upon the request of the aforementioned individual for the purpose below:";
        let midLines = doc.splitTextToSize(midText, 160);
        doc.text(midLines, 25, fieldsY);
        fieldsY += 35;
        drawField("Purpose", purpose || 'Personal Use');
      } else if (certType === 'residency') {
        doc.text("This is to certify that the person (the requestor), whose information is indicated below, is known to me as a bona fide resident of this barangay.", 25, fieldsY);
        fieldsY += 15;
        drawField("Requestor's Name", fullName.toUpperCase());
        drawField("Postal Address", address);
        fieldsY += 10;
        doc.text("This certification is being issued upon the request of the aforementioned individual for the purpose below:", 25, fieldsY);
        fieldsY += 15;
        drawField("Purpose", purpose || 'Personal Use');
      } else if (certType === 'jobseeker') {
        let introText = `This is to certify that the person (the requestor), whose information is indicated below, is known to me as a Bonafide resident of this barangay. Further, I certify that she is qualified availed of RA 11261 or the First-Time Jobseekers Act of 2019.`;
        introLines = doc.splitTextToSize(introText, 160);
        doc.text(introLines, 25, fieldsY);
        fieldsY += 15;
        drawField("Requestor's Name", fullName.toUpperCase());
        drawField("Postal Address", address);
        fieldsY += 5;
        doc.setFont('Helvetica', 'Normal');
        doc.text("Marital Status", 35, fieldsY);
        doc.line(65, fieldsY + 1, 110, fieldsY + 1);
        doc.setFont('Helvetica', 'Bold');
        doc.text(maritalStatus, 65, fieldsY);
        doc.setFont('Helvetica', 'Normal');
        doc.text("Citizenship", 35, fieldsY + 10);
        doc.line(65, fieldsY + 11, 110, fieldsY + 11);
        doc.setFont('Helvetica', 'Bold');
        doc.text(citizenship, 65, fieldsY + 10);
        fieldsY += 25;
        let midText = "I further certify that the holder was informed of her rights including the duties and responsibilities accorded by RA 11261 through the Oath of Undertaking he has signed and executed in the presence of the Punong Barangay.";
        let midLines = doc.splitTextToSize(midText, 160);
        doc.text(midLines, 25, fieldsY);
        fieldsY += 20;
      }
    } else {
      // OTHER CERTIFICATES (PARAGRAPH-BASED: general, good_moral)
      doc.setFontSize(12);
      doc.setFont('Helvetica', 'Normal');
      if (certType !== 'general') {
        doc.text('TO WHOM IT MAY CONCERN:', 25, fieldsY);
        fieldsY += 12;
      }

      if (certType === 'general') {
        const bodyTextRaw = `This is to certify that ${fullName.toUpperCase()}, of legal age and with residence address at ${address}, is a bona fide resident of Barangay 635, Zone 64, District VI of the City of Manila.\n\nI further certify that their address at ${address} is not being rented nor being used for business purposes.\n\nThis certification is issued for ${purpose || 'BIR Requirement'}.`;
        const bodyLinesRaw = doc.splitTextToSize(bodyTextRaw, 160);
        doc.text(bodyLinesRaw, 25, fieldsY);
        fieldsY += bodyLinesRaw.length * 7 + 10;
      } else {
        const bodyLines = doc.splitTextToSize(certificateBody, 160);
        doc.text(bodyLines, 25, fieldsY);
        fieldsY += bodyLines.length * 7 + 10;
      }
    }

    // Bottom Validation (Skipped for Oath)
    if (certType !== 'oath') {
      fieldsY = Math.max(fieldsY, certType === 'general' ? 120 : 180);
      doc.setFontSize(11);
      doc.setFont('Helvetica', 'Normal');

      let validMonths = (certType === 'indigency' || certType === 'residency') ? 6 : 3;
      let bottomNote = `Issued on ${new Date(issueDate).toLocaleDateString('en-PH', { day: 'numeric', month: 'long', year: 'numeric' })} at Barangay 635, Zone 64, District VI, City of Manila, Philippines. `;
      if (certType !== 'general') {
        bottomNote += `Moreover, this certificate is VALID only for ${validMonths} MONTHS FROM THE DATE ISSUED.`;
      }
      const bottomLines = doc.splitTextToSize(bottomNote, 160);
      doc.text(bottomLines, 25, fieldsY);

      // Signatories
      fieldsY = Math.max(fieldsY + 40, 230);
      doc.setFont('Helvetica', 'Bold');
      doc.text(captainName.toUpperCase(), 25, fieldsY);
      doc.setFont('Helvetica', 'Normal');
      doc.text('Punong Barangay', 25, fieldsY + 5);

      doc.setFontSize(8);
      doc.setFont('Helvetica', 'Italic');
      doc.text('Barangay Dry Seal', 180, fieldsY, { align: 'right' });
    }

    // Footer lines
    drawLine(280, 0.5); // Bottom line
    doc.setFontSize(9);
    doc.setFont('Helvetica', 'Bold');
    doc.text('This document is VALID ONLY if signed by the Punong Barangay and imprinted with the Barangay dry seal.', 105, 287, { align: 'center' });

    doc.save(`${certType}_${fullName.replace(/\s+/g, '_').toLowerCase()}.pdf`);

    // Save certificate record
    try {
      await api.post('/certificates', {
        resident_id: selectedResident.id,
        certificate_type: certType,
        serial_number: serialNo,
        purpose: purpose || null,
        issue_date: issueDate,
        place_issued: placeIssued || null,
        amount: amount || null,
      });
    } catch (err) {
      console.error('Error saving certificate record:', err);
      // Don't show error to user as PDF was already generated
    }
  };

  const handleGenerateWord = async () => {
    setError('');
    if (!selectedResident) {
      setError('Please select a resident.');
      return;
    }

    if (!serialNumber || serialNumber.trim() === '') {
      setError('Serial Number is required.');
      return;
    }

    try {
      const fullName = buildFullName(selectedResident);
      const address = selectedResident.address || `${barangayName}, ${municipality}, ${province}`;
      const maritalStatus = selectedResident.civil_status || 'N/A';
      const citizenship = selectedResident.citizenship || 'Filipino';
      const currentYear = new Date(issueDate).getFullYear();
      const serialNo = serialNumber.trim();
      const certTitleObj = CERTIFICATE_TYPES.find((c) => c.value === certType);
      const certTitle = certTitleObj ? certTitleObj.label.toUpperCase() : 'CERTIFICATE';
      const ageNum = calculateAge(selectedResident.birthdate);

      // Fetch logo as buffer
      const response = await fetch(logo);
      const blob = await response.blob();
      const logoBuffer = await blob.arrayBuffer();

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              // Header Table (Logo | Barangay Text | Year)
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                  top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.SINGLE, size: 2 },
                  left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
                  insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE },
                },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        width: { size: 20, type: WidthType.PERCENTAGE },
                        children: [
                          new Paragraph({
                            children: [
                              new ImageRun({
                                data: logoBuffer,
                                transformation: { width: 80, height: 80 },
                              }),
                            ],
                          }),
                        ],
                      }),
                      new TableCell({
                        width: { size: 60, type: WidthType.PERCENTAGE },
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                              new TextRun({ text: `BARANGAY ${barangayName.toUpperCase()}`, bold: true, size: 36 }),
                            ],
                          }),
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                              new TextRun({ text: "ZONE 64, DISTRICT VI, MANILA", size: 18 }),
                            ],
                          }),
                        ],
                        verticalAlign: "center",
                      }),
                      new TableCell({
                        width: { size: 20, type: WidthType.PERCENTAGE },
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            children: [
                              new TextRun({ text: `${currentYear}`, bold: true, size: 56 }),
                            ],
                          }),
                          new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            children: [
                              new TextRun({ text: "Permits and Clearances", size: 14 }),
                            ],
                          }),
                        ],
                        verticalAlign: "center",
                      }),
                    ],
                  }),
                ],
              }),

              new Paragraph({ text: "", spacing: { before: 200 } }),

              // Serial No
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ text: "Serial No. ", size: 18 }),
                  new TextRun({ text: serialNo, bold: true, underline: true, size: 18 }),
                ],
              }),

              new Paragraph({ text: "", spacing: { before: 400 } }),

              // Title
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: certType === 'oath' ? 'OATH OF UNDERTAKING' : (certType === 'general' ? 'CERTIFICATION' : certTitle),
                    bold: true,
                    size: certType === 'oath' ? 48 : 40
                  }),
                ],
              }),

              new Paragraph({ text: "", spacing: { before: 600 } }),

              // Body Content
              ...(certType === 'oath' ? [
                new Paragraph({
                  alignment: AlignmentType.JUSTIFY,
                  children: [
                    new TextRun({ text: `I, ${fullName.toUpperCase()}, ${ageNum} years of age, resident of ${address}, Barangay 635, Zone 64, District VI, City of Manila for [Years] years, availing the benefits of Republic Act 11261, otherwise known as the First Time Jobseekers Act 2019, do hereby declare, agree and undertake to abide and be bound by the following:` }),
                  ],
                }),
                ...[
                  "That this is the first time that I will actively look for a job, and therefore requesting that a Barangay Certification be issued in my favor to avail the benefits of the law;",
                  "That I am aware that the benefit and privilege/s under the said law shall be valid only for one (1) year from the date that the Barangay Certification is issued;",
                  "That I can avail the benefits of the law only once;",
                  "That I understand that my personal information shall be included in the Roster/List of the First Time Jobseekers and will not be used for any unlawful purpose;",
                  "That I will inform and/or report to the Barangay personally, through text or other means, or through my family/relatives once I get employed; and",
                  "That I am not a beneficiary of the Job Start Program under R.A. No. 10869 and other laws that give similar exemptions for the documents or transactions exempted under R.A. No. 11261;",
                  "That if issued the requested Certification, I will not use the same in any fraud, and neither falsifies nor helps and/or assists in the fabrication of the said certification.",
                  "That this undertaking is made solely for the purpose of obtaining a Barangay Certification consistent with the objective of R.A. No. 11261 and not for any other purpose.",
                  "That I consent to the use of my personal information pursuant to the Data Privacy Act and other applicable laws, rules, and regulations."
                ].map((item, i) => new Paragraph({
                  indent: { left: 720, hanging: 360 },
                  children: [new TextRun({ text: `${i + 1}. ${item}` })]
                })),
                new Paragraph({ text: "", spacing: { before: 400 } }),
                new Paragraph({
                  children: [
                    new TextRun({ text: `Signed this ${new Date(issueDate).toLocaleDateString('en-PH', { day: 'numeric' })}th Day of ${new Date(issueDate).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })}, at Barangay 635, Zone 64, District VI, City of Manila.` }),
                  ],
                }),
                new Paragraph({ text: "", spacing: { before: 800 } }),
                new Paragraph({ children: [new TextRun({ text: fullName.toUpperCase(), bold: true })] }),
                new Paragraph({ children: [new TextRun({ text: "First Time Jobseeker" })] }),
                new Paragraph({ text: "", spacing: { before: 400 } }),
                new Paragraph({ children: [new TextRun({ text: "Witnessed by:" })] }),
                new Paragraph({ text: "", spacing: { before: 400 } }),
                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  borders: { top: BorderStyle.NONE, bottom: BorderStyle.NONE, left: BorderStyle.NONE, right: BorderStyle.NONE, insideHorizontal: BorderStyle.NONE, insideVertical: BorderStyle.NONE },
                  rows: [
                    new TableRow({
                      children: [
                        new TableCell({
                          children: [
                            new Paragraph({ children: [new TextRun({ text: captainName.toUpperCase(), bold: true })] }),
                            new Paragraph({ children: [new TextRun({ text: "Punong Barangay" })] }),
                          ]
                        }),
                        new TableCell({
                          children: [
                            new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "CELESTE A. SAN BUENO", bold: true })] }),
                            new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Barangay Kagawad" })] }),
                          ]
                        }),
                      ],
                    }),
                  ],
                }),
              ] : (certType === 'clearance' || certType === 'indigency' || certType === 'residency' || certType === 'jobseeker') ? [
                new Paragraph({
                  alignment: AlignmentType.JUSTIFY,
                  children: [
                    new TextRun({
                      text: (certType === 'clearance' ? "This is to certify that the person (the requestor), whose information is indicated below, is known to me as a bona fide resident of this barangay. Further, I certify that he/she is found to have NO DEROGATORY RECORD in our Barangay." :
                        certType === 'indigency' ? "This is to certify that the below indicated person is a bona fide resident of this barangay:" :
                          certType === 'residency' ? "This is to certify that the person (the requestor), whose information is indicated below, is known to me as a bona fide resident of this barangay." :
                            "This is to certify that the person (the requestor), whose information is indicated below, is known to me as a Bonafide resident of this barangay. Further, I certify that she is qualified availed of RA 11261 or the First-Time Jobseekers Act of 2019.")
                    })
                  ],
                }),
                new Paragraph({ text: "", spacing: { before: 200 } }),
                new Table({
                  width: { size: 85, type: WidthType.PERCENTAGE },
                  alignment: AlignmentType.CENTER,
                  borders: { top: BorderStyle.NONE, bottom: BorderStyle.NONE, left: BorderStyle.NONE, right: BorderStyle.NONE, insideHorizontal: BorderStyle.NONE, insideVertical: BorderStyle.NONE },
                  rows: [
                    new TableRow({
                      children: [
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: certType === 'indigency' ? "Requestor" : "Requestor's Name" })] })] }),
                        new TableCell({ borders: { bottom: { style: BorderStyle.SINGLE } }, children: [new Paragraph({ children: [new TextRun({ text: fullName.toUpperCase(), bold: true })] })] }),
                      ]
                    }),
                    new TableRow({
                      children: [
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Postal Address" })] })] }),
                        new TableCell({ borders: { bottom: { style: BorderStyle.SINGLE } }, children: [new Paragraph({ children: [new TextRun({ text: address })] })] }),
                      ]
                    }),
                  ],
                }),
                ...(certType === 'clearance' || certType === 'jobseeker' ? [
                  new Table({
                    width: { size: 85, type: WidthType.PERCENTAGE },
                    alignment: AlignmentType.CENTER,
                    borders: { top: BorderStyle.NONE, bottom: BorderStyle.NONE, left: BorderStyle.NONE, right: BorderStyle.NONE, insideHorizontal: BorderStyle.NONE, insideVertical: BorderStyle.NONE },
                    rows: [
                      new TableRow({
                        children: [
                          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Marital Status" })] })] }),
                          new TableCell({ borders: { bottom: { style: BorderStyle.SINGLE } }, children: [new Paragraph({ children: [new TextRun({ text: maritalStatus, bold: true })] })] }),
                          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Citizenship" })] })] }),
                          new TableCell({ borders: { bottom: { style: BorderStyle.SINGLE } }, children: [new Paragraph({ children: [new TextRun({ text: citizenship, bold: true })] })] }),
                        ]
                      }),
                    ],
                  })
                ] : []),
                ...(certType === 'indigency' ? [
                  new Paragraph({ text: "", spacing: { before: 200 } }),
                  new Paragraph({ alignment: AlignmentType.JUSTIFY, children: [new TextRun({ text: "I also certify that the above named person is known for his/her good character and without any derogatory record in this barangay." })] }),
                  new Paragraph({ alignment: AlignmentType.JUSTIFY, children: [new TextRun({ text: "Further, this certifies that the above-mentioned person is also one of the INDIGENTS of the barangay.", bold: true })] }),
                ] : []),
                ...(certType === 'jobseeker' ? [
                  new Paragraph({ text: "", spacing: { before: 200 } }),
                  new Paragraph({ alignment: AlignmentType.JUSTIFY, children: [new TextRun({ text: "I further certify that the holder was informed of her rights including the duties and responsibilities accorded by RA 11261 through the Oath of Undertaking he has signed and executed in the presence of the Punong Barangay." })] }),
                ] : []),
                ...(certType !== 'jobseeker' ? [
                  new Paragraph({ text: "", spacing: { before: 400 } }),
                  new Paragraph({ children: [new TextRun({ text: "This certification is being issued upon the request of the aforementioned individual for the purpose below:" })] }),
                  new Table({
                    width: { size: 85, type: WidthType.PERCENTAGE },
                    alignment: AlignmentType.CENTER,
                    rows: [
                      new TableRow({
                        children: [
                          new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, borders: { top: BorderStyle.NONE, bottom: BorderStyle.NONE, left: BorderStyle.NONE, right: BorderStyle.NONE }, children: [new Paragraph({ children: [new TextRun({ text: "Purpose" })] })] }),
                          new TableCell({ width: { size: 70, type: WidthType.PERCENTAGE }, borders: { top: BorderStyle.NONE, bottom: { style: BorderStyle.SINGLE }, left: BorderStyle.NONE, right: BorderStyle.NONE }, children: [new Paragraph({ children: [new TextRun({ text: purpose || "Personal Use", bold: true })] })] }),
                        ]
                      }),
                    ],
                  })
                ] : []),
              ] : [
                ...(certType !== 'general' ? [
                  new Paragraph({ children: [new TextRun({ text: "TO WHOM IT MAY CONCERN:", bold: true })] }),
                  new Paragraph({ text: "", spacing: { before: 200 } }),
                ] : []),
                new Paragraph({
                  alignment: AlignmentType.JUSTIFY,
                  children: [
                    ...(certType === 'general' ? [
                      new TextRun({ text: `This is to certify that ` }),
                      new TextRun({ text: fullName.toUpperCase(), bold: true }),
                      new TextRun({ text: `, of legal age and with residence address at ` }),
                      new TextRun({ text: address, bold: true }),
                      new TextRun({ text: `, is a bona fide resident of Barangay 635, Zone 64, District VI of the City of Manila.` }),
                    ] : [
                      new TextRun({ text: buildCertificateBody() })
                    ])
                  ],
                }),
                ...(certType === 'general' ? [
                  new Paragraph({ text: "", spacing: { before: 200 } }),
                  new Paragraph({
                    alignment: AlignmentType.JUSTIFY, children: [
                      new TextRun({ text: `I further certify that their address at ${address} is not being rented nor being used for business purposes.` })
                    ]
                  }),
                  new Paragraph({ text: "", spacing: { before: 200 } }),
                  new Paragraph({
                    alignment: AlignmentType.JUSTIFY, children: [
                      new TextRun({ text: `This certification is issued for ` }),
                      new TextRun({ text: purpose || 'BIR Requirement', bold: true }),
                      new TextRun({ text: `.` }),
                    ]
                  }),
                ] : []),
              ]),

              new Paragraph({ text: "", spacing: { before: 1000 } }),

              // Bottom Note (Skipped for Oath)
              ...(certType !== 'oath' ? [
                new Paragraph({
                  alignment: AlignmentType.JUSTIFY,
                  children: [
                    new TextRun({ text: `Issued on ` }),
                    new TextRun({ text: new Date(issueDate).toLocaleDateString('en-PH', { day: 'numeric', month: 'long', year: 'numeric' }), bold: true }),
                    new TextRun({ text: ` at Barangay 635, Zone 64, District VI, City of Manila, Philippines. ` }),
                    ...(certType !== 'general' ? [
                      new TextRun({ text: `Moreover, this certificate is ` }),
                      new TextRun({ text: `VALID only for ${(certType === 'indigency' || certType === 'residency') ? 6 : 3} MONTHS FROM THE DATE ISSUED.`, bold: true }),
                    ] : []),
                  ],
                }),
                new Paragraph({ text: "", spacing: { before: 800 } }),
                // Signatory
                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  borders: { top: BorderStyle.NONE, bottom: BorderStyle.NONE, left: BorderStyle.NONE, right: BorderStyle.NONE, insideHorizontal: BorderStyle.NONE, insideVertical: BorderStyle.NONE },
                  rows: [
                    new TableRow({
                      children: [
                        new TableCell({
                          children: [
                            new Paragraph({ children: [new TextRun({ text: captainName.toUpperCase(), bold: true })] }),
                            new Paragraph({ children: [new TextRun({ text: "Punong Barangay" })] }),
                          ]
                        }),
                        new TableCell({
                          children: [
                            new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Barangay Dry Seal", italic: true, color: "999999" })] }),
                          ]
                        }),
                      ]
                    }),
                  ],
                }),
              ] : []),

              new Paragraph({ text: "", spacing: { before: 1200 } }),

              // Footer
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: { top: { style: BorderStyle.SINGLE, size: 2 }, bottom: BorderStyle.NONE, left: BorderStyle.NONE, right: BorderStyle.NONE },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [
                          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "This document is VALID ONLY if signed by the Punong Barangay and imprinted with the Barangay dry seal.", bold: true, size: 16 })] }),
                        ]
                      }),
                    ]
                  }),
                ],
              }),
            ],
          },
        ],
      });

      const blobDoc = await Packer.toBlob(doc);
      saveAs(blobDoc, `${certType}_${fullName.replace(/\s+/g, '_').toLowerCase()}.docx`);

      // Save certificate record
      try {
        await api.post('/certificates', {
          resident_id: selectedResident.id,
          certificate_type: certType,
          serial_number: serialNo,
          purpose: purpose || null,
          issue_date: issueDate,
          place_issued: placeIssued || null,
          amount: amount || null,
        });
      } catch (err) {
        console.error('Error saving certificate record:', err);
        // Don't show error to user as Word doc was already generated
      }
    } catch (err) {
      console.error(err);
      setError('Failed to generate Word document.');
    }
  };


  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Barangay Certificates
      </Typography>

      <Grid container spacing={2}>
        {/* Left side: form */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, mb: 2 }} elevation={2}>
            <Typography variant="h6" gutterBottom>
              Resident & Certificate Details
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  select
                  label="Resident"
                  value={selectedResidentId}
                  onChange={(e) => setSelectedResidentId(e.target.value)}
                  fullWidth
                  required
                >
                  {residents.map((r) => (
                    <MenuItem key={r.id} value={r.id}>
                      {r.last_name}, {r.first_name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  select
                  label="Certificate Type"
                  value={certType}
                  onChange={(e) => setCertType(e.target.value)}
                  fullWidth
                >
                  {CERTIFICATE_TYPES.map((c) => (
                    <MenuItem key={c.value} value={c.value}>
                      {c.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Purpose"
                  placeholder="e.g., employment, scholarship, school requirement"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Issue Date"
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Place of Issuance"
                  value={placeIssued}
                  onChange={(e) => setPlaceIssued(e.target.value)}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  label="Serial Number"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Amount (₱)"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  fullWidth
                />
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 2 }} elevation={2}>
            <Typography variant="h6" gutterBottom>
              Barangay Header & Officials
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Barangay Name"
                  value={barangayName}
                  onChange={(e) => setBarangayName(e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Municipality / City"
                  value={municipality}
                  onChange={(e) => setMunicipality(e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Province"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Punong Barangay"
                  value={captainName}
                  onChange={(e) => setCaptainName(e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Barangay Secretary"
                  value={secretaryName}
                  onChange={(e) => setSecretaryName(e.target.value)}
                  fullWidth
                />
              </Grid>
            </Grid>
          </Paper>

          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}

          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button variant="contained" onClick={handleGeneratePdf}>
              Generate PDF
            </Button>
            <Button variant="contained" color="secondary" onClick={handleGenerateWord}>
              Generate Word
            </Button>
          </Box>
        </Grid>

        {/* Right side: preview */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 4, minHeight: 600, position: 'relative' }} elevation={4}>
            {/* Professional Header Preview */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Box 
                component="img" 
                src={logo} 
                sx={{ 
                  height: 60, 
                  width: 60, 
                  borderRadius: '50%',
                  objectFit: 'cover',
                  mr: 2,
                  border: '2px solid rgba(0,0,0,0.1)',
                }} 
              />
              <Box sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', letterSpacing: 1 }}>
                  BARANGAY {barangayName}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block' }}>
                  ZONE 64, DISTRICT VI, MANILA
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#333' }}>
                  {new Date(issueDate).getFullYear()}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                  Permits and Clearances
                </Typography>
              </Box>
            </Box>
            <Divider sx={{ borderBottomWidth: 2, mb: 3 }} />

            <Box sx={{ textAlign: 'right', mb: 3 }}>
              <Typography variant="body2">
                Serial No. &nbsp;
                <span style={{
                  backgroundColor: '#f5f5f5',
                  padding: '2px 10px',
                  borderBottom: '1px solid #ccc',
                  fontWeight: 'bold'
                }}>
                  {serialNumber || '[Enter Serial Number]'}
                </span>
              </Typography>
            </Box>

            <Typography variant="h5" align="center" sx={{ fontWeight: certType === 'oath' ? '900' : 'bold', mb: 4, letterSpacing: 2 }}>
              {certType === 'oath' ? 'OATH OF UNDERTAKING' : (certType === 'general' ? 'CERTIFICATION' : CERTIFICATE_TYPES.find((c) => c.value === certType)?.label.toUpperCase())}
            </Typography>

            {/* Custom Layouts based on Image References */}
            {certType === 'oath' ? (
              <Box sx={{ fontSize: '0.85rem' }}>
                <Typography variant="body2" sx={{ textAlign: 'justify', mb: 2, fontWeight: 'medium' }}>
                  I, <strong>{selectedResident ? buildFullName(selectedResident).toUpperCase() : '[NAME]'}</strong>, <strong>{calculateAge(selectedResident?.birthdate)}</strong> years of age, resident of <strong>{selectedResident?.address || '[ADDRESS]'}</strong>, Barangay 635, Zone 64, District VI, City of Manila for [Years] years, availing the benefits of Republic Act 11261, otherwise known as the <strong>First Time Jobseekers Act 2019</strong>, do hereby declare, agree and undertake to abide and be bound by the following:
                </Typography>
                <ol style={{ paddingLeft: '20px', marginBottom: '15px' }}>
                  <li>That this is the first time that I will actively look for a job...</li>
                  <li>That I am aware that the benefit and privilege/s under the said law...</li>
                  <li>That I can avail the benefits of the law only once...</li>
                  <li>That I understand that my personal information shall be included...</li>
                </ol>
                <Typography variant="body2" sx={{ mb: 4 }}>
                  Signed this <strong>{new Date(issueDate).toLocaleDateString('en-PH', { day: 'numeric' })}th Day of {new Date(issueDate).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })}</strong>, at Barangay 635, Zone 64, District VI, City of Manila.
                </Typography>
                <Box sx={{ mb: 4 }}>
                  <Typography sx={{ fontWeight: 'bold' }}>{selectedResident ? buildFullName(selectedResident).toUpperCase() : '[NAME]'}</Typography>
                  <Typography variant="caption">First Time Jobseeker</Typography>
                </Box>
                <Typography variant="caption" sx={{ display: 'block', mb: 2 }}>Witnessed by:</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography sx={{ fontWeight: 'bold' }}>{captainName.toUpperCase()}</Typography>
                    <Typography variant="caption">Punong Barangay</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography sx={{ fontWeight: 'bold' }}>CELESTE A. SAN BUENO</Typography>
                    <Typography variant="caption">Barangay Kagawad</Typography>
                  </Box>
                </Box>
              </Box>
            ) : (certType === 'clearance' || certType === 'indigency' || certType === 'residency' || certType === 'jobseeker') ? (
              <>
                <Typography variant="body2" sx={{ textAlign: 'justify', mb: (certType === 'indigency' ? 2 : 4), fontSize: '1rem' }}>
                  {certType === 'clearance' && "This is to certify that the person (the requestor), whose information is indicated below, is known to me as a bona fide resident of this barangay. Further, I certify that he/she is found to have NO DEROGATORY RECORD in our Barangay."}
                  {certType === 'indigency' && "This is to certify that the below indicated person is a bona fide resident of this barangay:"}
                  {certType === 'residency' && "This is to certify that the person (the requestor), whose information is indicated below, is known to me as a bona fide resident of this barangay."}
                  {certType === 'jobseeker' && "This is to certify that the person (the requestor), whose information is indicated below, is known to me as a Bonafide resident of this barangay. Further, I certify that she is qualified availed of RA 11261 or the First-Time Jobseekers Act of 2019."}
                </Typography>

                {/* Fields Grid */}
                <Box sx={{ px: 4, mb: 2 }}>
                  {[
                    { label: (certType === 'indigency' ? "Requestor" : "Requestor's Name"), value: selectedResident ? buildFullName(selectedResident).toUpperCase() : "" },
                    { label: "Postal Address", value: selectedResident?.address || "" },
                  ].map((field) => (
                    <Box key={field.label} sx={{ display: 'flex', mb: 1, borderBottom: '1px solid #eee', pb: 0.5 }}>
                      <Typography variant="body2" sx={{ width: 140, fontWeight: 'medium' }}>{field.label}</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{field.value}</Typography>
                    </Box>
                  ))}

                  {(certType === 'clearance' || certType === 'jobseeker') && (
                    <Box sx={{ display: 'flex', gap: 4 }}>
                      <Box sx={{ display: 'flex', flexGrow: 1, borderBottom: '1px solid #eee', pb: 0.5 }}>
                        <Typography variant="body2" sx={{ width: 100, fontWeight: 'medium' }}>Marital Status</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{selectedResident?.civil_status || ""}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexGrow: 1, borderBottom: '1px solid #eee', pb: 0.5 }}>
                        <Typography variant="body2" sx={{ width: 90, fontWeight: 'medium' }}>Citizenship</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{selectedResident?.citizenship || ""}</Typography>
                      </Box>
                    </Box>
                  )}
                </Box>

                {certType === 'indigency' && (
                  <Typography variant="body2" sx={{ textAlign: 'justify', mb: 2, fontSize: '0.95rem' }}>
                    I also certify that the above named person is known for his/her good character and without any derogatory record in this barangay. <br /><br />
                    Further, this certifies that the above-mentioned person is also one of the <strong>INDIGENTS</strong> of the barangay.
                  </Typography>
                )}

                {certType === 'jobseeker' && (
                  <Typography variant="body2" sx={{ textAlign: 'justify', mb: 2, fontSize: '0.95rem' }}>
                    I further certify that the holder was informed of her rights including the duties and responsibilities accorded by RA 11261 through the Oath of Undertaking he has signed and executed in the presence of the Punong Barangay.
                  </Typography>
                )}

                {(certType !== 'jobseeker') && (
                  <>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      This certification is being issued upon the request of the aforementioned individual for the purpose below:
                    </Typography>
                    <Box sx={{ px: 4, display: 'flex', mb: 4, borderBottom: '1px solid #eee', pb: 0.5 }}>
                      <Typography variant="body2" sx={{ width: 100, fontWeight: 'medium' }}>Purpose</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{purpose || "Personal Use"}</Typography>
                    </Box>
                  </>
                )}
              </>
            ) : (
              <>
                {certType !== 'general' && (
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    TO WHOM IT MAY CONCERN:
                  </Typography>
                )}
                <Typography variant="body1" sx={{ textAlign: 'justify', mb: 4, whiteSpace: 'pre-wrap' }}>
                  {certType === 'general' ? (
                    <>
                      This is to certify that <strong>{selectedResident ? buildFullName(selectedResident).toUpperCase() : '[NAME]'}</strong>, of legal age and with residence address at <strong>{selectedResident?.address || '[ADDRESS]'}</strong>, is a bona fide resident of Barangay 635, Zone 64, District VI of the City of Manila.<br /><br />
                      I further certify that their address at {selectedResident?.address || '[ADDRESS]'} is not being rented nor being used for business purposes.<br /><br />
                      This certification is issued for <strong>{purpose || 'BIR Requirement'}</strong>.
                    </>
                  ) : (
                    selectedResident ? certificateBody : (
                      <em>Select a resident to preview the certificate body.</em>
                    )
                  )}
                </Typography>
              </>
            )}

            {certType !== 'oath' && (
              <>
                <Typography variant="body2" sx={{ mb: 6, fontSize: '0.9rem' }}>
                  Issued on <strong>{new Date(issueDate).toLocaleDateString('en-PH', { day: 'numeric', month: 'long', year: 'numeric' })}</strong> at Barangay 635, Zone 64, District VI, City of Manila, Philippines.
                  {certType !== 'general' && (
                    <> Moreover, this certificate is <strong>VALID only for {(certType === 'indigency' || certType === 'residency') ? 6 : 3} MONTHS FROM THE DATE ISSUED.</strong></>
                  )}
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{captainName}</Typography>
                    <Typography variant="caption">Punong Barangay</Typography>
                  </Box>
                  <Typography variant="caption" sx={{ fontStyle: 'italic', color: '#999' }}>Barangay Dry Seal</Typography>
                </Box>
              </>
            )}

            <Box sx={{ mt: 4, pt: 1, borderTop: '2px solid #000', textAlign: 'center' }}>
              <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                This document is VALID ONLY if signed by the Punong Barangay and imprinted with the Barangay dry seal.
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CertificatesPage;
