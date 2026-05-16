import React from 'react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from '../lib/utils';

interface ShareData {
  customerName: string;
  items: any[];
  subtotal: number;
  previousBalance: number;
  courierCharge?: number;
  manualPendingAmount?: number;
  finalTotal: number;
  date: string;
}

export const useReceiptSharing = () => {
  const handleShareText = (data: ShareData) => {
    const itemsText = (data.items || []).map(item => 
      `• ${item.name}${item.variant ? ` [${item.variant}]` : ''}: ${item.quantity}${item.unit} @ ₹${item.price} = ₹${item.total}`
    ).join('\n');

    const text = `*BAHETI'S BILLING*\n` +
                 `Customer: ${data.customerName}\n` +
                 `Date: ${data.date}\n\n` +
                 `*Items:*\n${itemsText}\n\n` +
                 `Subtotal: ₹${data.subtotal}\n` +
                 (data.previousBalance > 0 ? `Prev Balance: ₹${data.previousBalance}\n` : '') +
                 (data.courierCharge ? `Courier Chg: ₹${data.courierCharge}\n` : '') +
                 (data.manualPendingAmount ? `Added Pending: ₹${data.manualPendingAmount}\n` : '') +
                 `*Total Paid: ₹${data.finalTotal}*\n\n` +
                 `Thank you!`;

    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };

  const handleShareImage = async (ref: React.RefObject<HTMLDivElement>, customerName: string) => {
    if (ref.current) {
      try {
        // High quality sharp image
        const dataUrl = await toPng(ref.current, { 
          cacheBust: true, 
          quality: 1.0, 
          pixelRatio: 4, // 4x sharpness
          style: {
            transform: 'scale(1)',
            transformOrigin: 'top left'
          }
        });
        
        // Attempt to use Web Share API for native sharing feel (like Paytm)
        if (navigator.share && navigator.canShare) {
          const res = await fetch(dataUrl);
          const blob = await res.blob();
          const file = new File([blob], `Bill_${customerName.replace(/\s+/g, '_')}.png`, { type: 'image/png' });
          
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: `Bill for ${customerName}`,
              text: `Receipt from Baheti's Billing for ${customerName}`
            });
            return;
          }
        }

        // Fallback to download if Share API not supported
        const link = document.createElement('a');
        link.download = `Bill_${customerName.replace(/\s+/g, '_')}.png`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error('Failed to generate or share image', err);
      }
    }
  };

  const generatePDF = async (ref: React.RefObject<HTMLDivElement>, customerName: string) => {
    if (ref.current) {
      try {
        // Use high pixel ratio for print-quality PDF
        const dataUrl = await toPng(ref.current, { 
          cacheBust: true, 
          quality: 1.0, 
          pixelRatio: 4 
        });
        
        const doc = new jsPDF('p', 'mm', 'a4');
        const imgProps = (doc as any).getImageProperties(dataUrl);
        const pdfWidth = doc.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        // Center the receipt on the page if it's smaller than A4
        const xOffset = (pdfWidth - pdfWidth) / 2; // already full width
        
        doc.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
        doc.save(`Invoice_${customerName.replace(/\s+/g, '_')}.pdf`);
      } catch (err) {
        console.error('Failed to generate PDF', err);
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return { handleShareText, handleShareImage, generatePDF, handlePrint };
};
