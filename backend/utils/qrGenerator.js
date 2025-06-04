// utils/qrGenerator.js
const qrcode = require('qrcode'); 

const generateQrDataForPayment = async (pedidoInfo) => {
  console.log('Generando datos QR para el pedido:', pedidoInfo);

  // Datos ficticios para la cuenta bancaria de DIAMANTECH
  const datosBancarios = "1054503956"; 
  const nombreBeneficiario = "DIAMANTECH Joyería Online";
  const bancoBeneficiario = "BNB";
  const moneda = "BOB"; 
  const referencia = `Pedido ${pedidoInfo.codigo_pedido}`;
  const monto = pedidoInfo.total_pedido;

  const qrString = `
Beneficiario: ${nombreBeneficiario}
Banco: ${bancoBeneficiario}
Cuenta: ${datosBancarios}
Monto: ${monto} ${moneda}
Referencia: ${referencia}
Concepto: Compra en DIAMANTECH
`.trim(); 

  let qrCodeImageUrl = null;
  try {
    qrCodeImageUrl = await qrcode.toDataURL(qrString, { errorCorrectionLevel: 'H', width: 250 });
  } catch (err) {
    console.error('Error al generar el QR code image:', err);
  }

  return {
    qrDataString: qrString, 
    qrImageUrl: qrCodeImageUrl, 
    message: "Escanea el código QR con tu aplicación bancaria",
    instructions: `Realiza una transferencia por ${monto} ${moneda} a la cuenta ${datosBancarios} de ${nombreBeneficiario} en ${bancoBeneficiario}. Utiliza "${referencia}" como glosa/referencia del pago.`
  };
};

module.exports = {
  generateQrDataForPayment,
};
