/* Pricing configuration */
const CONFIG = {
  whatsappNumber: "91XXXXXXXXXX",
  basePrices: {
    acrylic: 800,
    wooden: 600,
    decorative: 500,
  },
  materialMultipliers: {
    acrylic: 1.2,
    wood: 1.0,
    mixed: 1.4,
  },
  sizeAddons: {
    small: 0,
    medium: 300,
    large: 700,
    custom: 1000,
  },
  engravingAddon: 200,
  discountTiers: [
    { min: 21, rate: 0.1 },
    { min: 6, rate: 0.05 },
  ],
  estimateRange: {
    min: 0.9,
    max: 1.15,
  },
};

const elements = {
  name: document.getElementById("customer-name"),
  contact: document.getElementById("customer-contact"),
  category: document.getElementById("product-category"),
  material: document.getElementById("material"),
  size: document.getElementById("size"),
  quantity: document.getElementById("quantity"),
  engraving: document.getElementById("engraving"),
  notes: document.getElementById("custom-notes"),
  priceRange: document.getElementById("price-range"),
  summary: document.getElementById("summary-details"),
};

const buttons = {
  whatsappCta: document.getElementById("whatsapp-cta"),
  heroWhatsapp: document.getElementById("hero-whatsapp"),
  heroQuote: document.getElementById("hero-quote"),
  whatsappPrice: document.getElementById("whatsapp-price"),
  whatsappConfirm: document.getElementById("whatsapp-confirm"),
  downloadPdf: document.getElementById("download-pdf"),
  contactWhatsapp: document.getElementById("contact-whatsapp"),
};

const formatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const formatCurrency = (value) => formatter.format(value).replace("₹", "₹");

// Ensure quantity is always a valid positive integer.
const sanitizeQuantity = () => {
  const qty = parseInt(elements.quantity.value, 10);
  elements.quantity.value = Number.isNaN(qty) || qty < 1 ? 1 : qty;
};

// Apply the correct discount tier based on quantity.
const applyDiscount = (amount, quantity) => {
  const tier = CONFIG.discountTiers.find((discount) => quantity >= discount.min);
  const rate = tier ? tier.rate : 0;
  const discountAmount = amount * rate;
  return {
    rate,
    discountAmount,
    total: amount - discountAmount,
  };
};

// Calculate the pricing breakdown for the current form state.
const calculatePrice = () => {
  sanitizeQuantity();
  const quantity = parseInt(elements.quantity.value, 10);
  const basePrice = CONFIG.basePrices[elements.category.value] || 0;
  const materialMultiplier = CONFIG.materialMultipliers[elements.material.value] || 1;
  const sizeAddon = CONFIG.sizeAddons[elements.size.value] || 0;
  const engravingAddon = elements.engraving.value === "yes" ? CONFIG.engravingAddon : 0;
  const addOnsTotal = sizeAddon + engravingAddon;

  const perUnit = basePrice * materialMultiplier + sizeAddon + engravingAddon;
  const subtotal = perUnit * quantity;
  const discount = applyDiscount(subtotal, quantity);
  const minEstimate = Math.round(discount.total * CONFIG.estimateRange.min);
  const maxEstimate = Math.round(discount.total * CONFIG.estimateRange.max);

  return {
    quantity,
    basePrice,
    materialMultiplier,
    sizeAddon,
    engravingAddon,
    addOnsTotal,
    perUnit,
    subtotal,
    discount,
    minEstimate,
    maxEstimate,
  };
};

// Update the on-screen summary and return the latest data.
const updateSummary = () => {
  const data = calculatePrice();

  elements.priceRange.textContent = `Estimated Price Range: ${formatCurrency(
    data.minEstimate
  )} – ${formatCurrency(data.maxEstimate)} (Final price may vary based on design complexity)`;

  const discountText = data.discount.rate
    ? `${Math.round(data.discount.rate * 100)}% (${formatCurrency(data.discount.discountAmount)})`
    : "No discount";

  elements.summary.innerHTML = `
    <span><strong>Base price</strong><em>${formatCurrency(data.basePrice)}</em></span>
    <span><strong>Material multiplier</strong><em>${data.materialMultiplier.toFixed(1)}x</em></span>
    <span><strong>Add-ons (size + engraving)</strong><em>${formatCurrency(data.addOnsTotal)}</em></span>
    <span><strong>Per unit</strong><em>${formatCurrency(data.perUnit)}</em></span>
    <span><strong>Subtotal</strong><em>${formatCurrency(data.subtotal)}</em></span>
    <span><strong>Discount applied</strong><em>${discountText}</em></span>
    <span><strong>Final estimate</strong><em>${formatCurrency(data.discount.total)}</em></span>
  `;

  return data;
};

// Gather form values for WhatsApp and PDF templates.
const getFormValues = () => ({
  name: elements.name.value || "Customer",
  contact: elements.contact.value || "Not provided",
  category: elements.category.options[elements.category.selectedIndex].text,
  material: elements.material.options[elements.material.selectedIndex].text,
  size: elements.size.options[elements.size.selectedIndex].text,
  quantity: elements.quantity.value,
  engraving: elements.engraving.value === "yes" ? "Yes" : "No",
  notes: elements.notes.value || "No additional notes",
});

// Build WhatsApp deep link with encoded message.
const generateWhatsAppMessage = (priceData) => {
  const details = getFormValues();
  const message = `Hello,\nI would like a quotation for a custom product.\n\nProduct: ${details.category}\nMaterial: ${details.material}\nSize: ${details.size}\nQuantity: ${details.quantity}\nEngraving: ${details.engraving}\nEstimated Price Range: ${formatCurrency(
    priceData.minEstimate
  )} – ${formatCurrency(priceData.maxEstimate)}\nCustom Notes: ${details.notes}`;

  return `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
};

// Generate a downloadable quotation using jsPDF.
const generatePDF = (priceData) => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const details = getFormValues();
  const date = new Date();
  const quotationNumber = `QTN-${Date.now().toString().slice(-6)}`;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Crafted Honors", 20, 20);
  doc.setFontSize(10);
  doc.rect(150, 12, 40, 18);
  doc.text("Logo", 165, 23, { align: "center" });
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Custom Gifting & Awards", 20, 27);

  doc.setFontSize(12);
  doc.text(`Date: ${date.toLocaleDateString("en-IN")}`, 20, 40);
  doc.text(`Quotation No: ${quotationNumber}`, 20, 47);

  doc.setFont("helvetica", "bold");
  doc.text("Customer Details", 20, 60);
  doc.setFont("helvetica", "normal");
  doc.text(`Name: ${details.name}`, 20, 67);
  doc.text(`Contact: ${details.contact}`, 20, 74);

  doc.setFont("helvetica", "bold");
  doc.text("Product Details", 20, 90);
  doc.setFont("helvetica", "normal");

  const tableStart = 98;
  const rowHeight = 8;
  const rows = [
    ["Product Type", details.category],
    ["Material", details.material],
    ["Size", details.size],
    ["Quantity", details.quantity],
    ["Engraving", details.engraving],
    [
      "Estimated Price",
      `${formatCurrency(priceData.minEstimate)} – ${formatCurrency(priceData.maxEstimate)}`,
    ],
  ];

  rows.forEach((row, index) => {
    const y = tableStart + index * rowHeight;
    doc.text(row[0], 20, y);
    doc.text(row[1], 90, y);
  });

  doc.setFont("helvetica", "italic");
  doc.text("Notes:", 20, 155);
  doc.text(details.notes, 20, 162, { maxWidth: 170 });
  doc.text(
    "Final price subject to design approval & material availability.",
    20,
    176,
    { maxWidth: 170 }
  );

  doc.setFont("helvetica", "normal");
  doc.text("Contact: +91 90000 00000 | hello@craftedhonors.in", 20, 190);
  doc.text("This is a system-generated quotation.", 20, 198);

  doc.save(`quotation-${quotationNumber}.pdf`);
};

const handleWhatsApp = () => {
  const priceData = updateSummary();
  window.open(generateWhatsAppMessage(priceData), "_blank");
};

Object.values(elements).forEach((element) => {
  if (element && element.addEventListener) {
    element.addEventListener("input", updateSummary);
    element.addEventListener("change", updateSummary);
  }
});

buttons.whatsappCta.addEventListener("click", handleWhatsApp);
buttons.heroWhatsapp.addEventListener("click", handleWhatsApp);
buttons.whatsappPrice.addEventListener("click", handleWhatsApp);
buttons.whatsappConfirm.addEventListener("click", handleWhatsApp);
buttons.contactWhatsapp.addEventListener("click", handleWhatsApp);
buttons.heroQuote.addEventListener("click", () => generatePDF(updateSummary()));
buttons.downloadPdf.addEventListener("click", () => generatePDF(updateSummary()));

updateSummary();
